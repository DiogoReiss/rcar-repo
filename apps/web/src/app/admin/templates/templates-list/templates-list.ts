import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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
  private readonly injector = inject(Injector);
  private readonly richEditor = viewChild<ElementRef<HTMLDivElement>>('richEditor');

  readonly templates = signal<Template[]>([]);
  readonly loading = signal(false);

  // Editor state
  readonly editing = signal<Template | null>(null);
  readonly saving = signal(false);
  readonly editName = signal('');
  readonly editHtml = signal('');
  readonly editVars = signal('');
  readonly draggingOverEditor = signal(false);
  readonly linkPanelOpen = signal(false);
  readonly linkUrl = signal('');
  readonly linkText = signal('');

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

    afterNextRender(() => {
      this.setEditorContent(t.conteudoHtml);
    }, { injector: this.injector });
  }

  onSave() {
    this.syncEditorToModel();
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
    this.syncEditorToModel();
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

  applyFormat(command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList') {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }
    editor.focus();
    document.execCommand(command, false);
    this.syncEditorToModel();
  }

  applyBlock(block: 'H1' | 'H2' | 'P') {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }
    editor.focus();
    document.execCommand('formatBlock', false, block);
    this.syncEditorToModel();
  }

  undo() {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }
    editor.focus();
    document.execCommand('undo', false);
    this.syncEditorToModel();
  }

  redo() {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }
    editor.focus();
    document.execCommand('redo', false);
    this.syncEditorToModel();
  }

  clearFormatting() {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }
    editor.focus();
    document.execCommand('removeFormat', false);
    this.syncEditorToModel();
  }

  onEditorInput() {
    this.syncEditorToModel();
  }

  onEditorKeyDown(event: KeyboardEvent) {
    const hasCommandKey = event.ctrlKey || event.metaKey;
    if (!hasCommandKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'k') {
      event.preventDefault();
      this.openLinkPanel();
      return;
    }

    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      this.redo();
      return;
    }

    if (key === 'y') {
      event.preventDefault();
      this.redo();
    }
  }

  openLinkPanel() {
    this.linkPanelOpen.set(true);
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? '';
    this.linkText.set(selectedText);
    this.linkUrl.set('https://');
  }

  closeLinkPanel() {
    this.linkPanelOpen.set(false);
    this.linkUrl.set('');
    this.linkText.set('');
  }

  insertLinkFromPanel() {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }

    const href = this.linkUrl().trim();
    if (!href || href === 'https://') {
      return;
    }

    const label = this.linkText().trim() || href;
    editor.focus();

    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    if (!selection.rangeCount || !editor.contains(selection.anchorNode)) {
      this.placeCaretAtEnd(editor, selection);
    }
    if (!selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    range.insertNode(link);
    range.setStartAfter(link);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    this.syncEditorToModel();
    this.closeLinkPanel();
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
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      this.editHtml.update((value) => `${value}${token}`);
      return;
    }

    editor.focus();
    const selection = window.getSelection();
    if (!selection) {
      this.editHtml.update((value) => `${value}${token}`);
      this.setEditorContent(this.editHtml());
      return;
    }

    if (!selection.rangeCount || !editor.contains(selection.anchorNode)) {
      this.placeCaretAtEnd(editor, selection);
    }

    if (!selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    const tokenNode = this.buildTokenNode(token);
    range.insertNode(tokenNode);
    range.setStartAfter(tokenNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.syncEditorToModel();
  }

  private setEditorContent(content: string) {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }
    editor.innerHTML = this.toEditorMarkup(content);
  }

  private syncEditorToModel() {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }
    this.editHtml.set(this.toTemplateMarkup(editor.innerHTML));
  }

  private placeCaretAtEnd(editor: HTMLDivElement, selection: Selection) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
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

  private buildTokenNode(token: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'template-token';
    span.contentEditable = 'false';
    span.dataset['token'] = token;
    span.textContent = token;
    return span;
  }

  private toEditorMarkup(content: string): string {
    return content.replace(/{{\s*([\w.]+)\s*}}/g, (_, key: string) => {
      const token = `{{${key}}}`;
      return `<span class="template-token" contenteditable="false" data-token="${token}">${token}</span>`;
    });
  }

  private toTemplateMarkup(content: string): string {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = content;
    const tokens = wrapper.querySelectorAll<HTMLSpanElement>('span.template-token[data-token]');
    for (const token of tokens) {
      const value = token.dataset['token'] ?? token.textContent ?? '';
      token.replaceWith(document.createTextNode(value));
    }
    return wrapper.innerHTML;
  }
}
