import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '@core/services/api.service';
import { environment } from '@env/environment';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly htmlEditor = viewChild<ElementRef<HTMLTextAreaElement>>('htmlEditor');

  readonly templates = signal<Template[]>([]);
  readonly loading = signal(false);

  // Editor state
  readonly editing = signal<Template | null>(null);
  readonly saving = signal(false);
  readonly editName = signal('');
  readonly editHtml = signal('');
  readonly editVars = signal('');
  readonly draggingOverEditor = signal(false);

  // Preview
  readonly previewHtml = signal<SafeHtml | null>(null);
  readonly previewVars = signal('{}');
  readonly previewing = signal(false);
  readonly isMock = environment.mock;
  readonly variableList = computed(() => this.parseVars(this.editVars()));

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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    this.previewVars.set(this.buildPreviewSeedJson(t.variaveis));
  }

  onSave() {
    this.saving.set(true);
    const vars = this.parseVars(this.editVars());
    this.api.patch(`/templates/${this.editing()!.id}`, {
      nome: this.editName(), conteudoHtml: this.editHtml(), variaveis: vars,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.editing.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  onPreview() {
    this.previewing.set(true);
    let vars: Record<string, unknown> = {};
    try { vars = JSON.parse(this.previewVars()); } catch { /* use empty */ }

    if (this.isMock) {
      const rendered = this.renderTemplateHtml(this.editHtml(), vars);
      this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(rendered));
      this.previewing.set(false);
      return;
    }

    this.api.post<{ html: string }>(`/templates/${this.editing()!.id}/preview`, vars)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(res.html)); this.previewing.set(false); },
        error: () => this.previewing.set(false),
      });
  }

  insertVariable(variable: string) {
    this.insertTokenAtCursor(`{{${variable}}}`);
  }

  onVariableDragStart(event: DragEvent, variable: string) {
    event.dataTransfer?.setData('text/plain', `{{${variable}}}`);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onEditorDragOver(event: DragEvent) {
    event.preventDefault();
    this.draggingOverEditor.set(true);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onEditorDragLeave() {
    this.draggingOverEditor.set(false);
  }

  onEditorDrop(event: DragEvent) {
    event.preventDefault();
    this.draggingOverEditor.set(false);
    const token = event.dataTransfer?.getData('text/plain')?.trim();
    if (!token) {
      return;
    }
    this.insertTokenAtCursor(token);
  }

  private insertTokenAtCursor(token: string) {
    const textarea = this.htmlEditor()?.nativeElement;
    if (!textarea) {
      this.editHtml.update((value) => `${value}${token}`);
      return;
    }

    textarea.focus();
    const current = this.editHtml();
    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`;

    this.editHtml.set(next);

    const caret = start + token.length;
    textarea.setSelectionRange(caret, caret);
  }

  private parseVars(raw: string): string[] {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, all) => all.indexOf(item) === index);
  }

  private buildPreviewSeedJson(vars: string[]): string {
    const seed = vars.reduce<Record<string, string>>((acc, variable) => {
      acc[variable] = this.exampleValueFor(variable);
      return acc;
    }, {});
    return JSON.stringify(seed, null, 2);
  }

  private exampleValueFor(variable: string): string {
    const normalized = variable.toLowerCase();
    if (normalized.includes('data')) return '2026-05-09';
    if (normalized.includes('valor')) return '199.90';
    if (normalized.includes('cpf') || normalized.includes('cnpj')) return '123.456.789-00';
    if (normalized.includes('placa')) return 'ABC1D23';
    if (normalized.includes('nome')) return 'Cliente Exemplo';
    if (normalized.includes('veiculo')) return 'Toyota Corolla';
    return `exemplo_${variable}`;
  }

  private renderTemplateHtml(content: string, vars: Record<string, unknown>): string {
    return content.replace(/{{\s*([\w.]+)\s*}}/g, (_, key: string) => {
      const value = vars[key];
      return value === undefined || value === null ? `{{${key}}}` : String(value);
    });
  }
}
