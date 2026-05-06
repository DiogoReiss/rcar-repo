import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '@core/services/api.service';
import PageHeaderComponent from '@shared/components/page-header/page-header';

interface Template {
  id: string; nome: string; tipo: string;
  conteudoHtml: string; variaveis: string[]; ativo: boolean;
}

@Component({
  selector: 'lync-templates-list',
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './templates-list.html',
  styleUrl: './templates-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TemplatesListComponent {
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly templates = signal<Template[]>([]);
  readonly loading = signal(false);

  // Editor state
  readonly editing = signal<Template | null>(null);
  readonly saving = signal(false);
  readonly editName = signal('');
  readonly editHtml = signal('');
  readonly editVars = signal('');

  // Preview
  readonly previewHtml = signal<SafeHtml | null>(null);
  readonly previewVars = signal('{}');
  readonly previewing = signal(false);

  readonly tipoLabel: Record<string, string> = {
    CONTRATO_LOCACAO: 'Contrato de Locação',
    RECIBO_LAVAGEM: 'Recibo Lavagem',
    RECIBO_LOCACAO: 'Recibo Locação',
  };

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.get<Template[]>('/templates')
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (res) => { this.templates.set(res); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  startEdit(t: Template) {
    this.editing.set(t);
    this.editName.set(t.nome);
    this.editHtml.set(t.conteudoHtml);
    this.editVars.set(t.variaveis.join(', '));
    this.previewHtml.set(null);
  }

  onSave() {
    this.saving.set(true);
    const vars = this.editVars().split(',').map(v => v.trim()).filter(Boolean);
    this.api.patch(`/templates/${this.editing()!.id}`, {
      nome: this.editName(), conteudoHtml: this.editHtml(), variaveis: vars,
    }).pipe(takeUntilDestroyed()).subscribe({
      next: () => { this.editing.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  onPreview() {
    this.previewing.set(true);
    let vars: Record<string, unknown> = {};
    try { vars = JSON.parse(this.previewVars()); } catch { /* use empty */ }
    this.api.post<{ html: string }>(`/templates/${this.editing()!.id}/preview`, vars)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (res) => { this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(res.html)); this.previewing.set(false); },
        error: () => this.previewing.set(false),
      });
  }
}
