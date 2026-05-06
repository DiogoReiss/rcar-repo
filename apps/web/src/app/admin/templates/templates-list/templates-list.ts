import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';

interface Template {
  id: string; nome: string; tipo: string;
  conteudoHtml: string; variaveis: string[]; ativo: boolean;
}

@Component({
  selector: 'lync-templates-list',
  imports: [FormsModule],
  templateUrl: './templates-list.html',
  styleUrl: './templates-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TemplatesListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly templates = signal<Template[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Editor state
  readonly editing = signal<Template | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
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

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<Template[]>('/templates'));
      this.templates.set(res);
    } finally { this.loading.set(false); }
  }

  startEdit(t: Template) {
    this.editing.set(t);
    this.editName.set(t.nome);
    this.editHtml.set(t.conteudoHtml);
    this.editVars.set(t.variaveis.join(', '));
    this.previewHtml.set(null);
    this.saveError.set(null);
  }

  async onSave() {
    this.saving.set(true); this.saveError.set(null);
    try {
      const vars = this.editVars().split(',').map(v => v.trim()).filter(Boolean);
      await firstValueFrom(this.api.patch(`/templates/${this.editing()!.id}`, {
        nome: this.editName(), conteudoHtml: this.editHtml(), variaveis: vars,
      }));
      this.editing.set(null);
      await this.load();
    } catch (e: any) {
      this.saveError.set(e?.error?.message ?? 'Erro ao salvar.');
    } finally { this.saving.set(false); }
  }

  async onPreview() {
    this.previewing.set(true);
    try {
      let vars: Record<string, unknown> = {};
      try { vars = JSON.parse(this.previewVars()); } catch { /* use empty */ }
      const res = await firstValueFrom(this.api.post<{ html: string }>(`/templates/${this.editing()!.id}/preview`, vars));
      this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(res.html));
    } finally { this.previewing.set(false); }
  }
}
