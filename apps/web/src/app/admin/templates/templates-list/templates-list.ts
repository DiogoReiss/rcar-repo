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
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';

interface Template {
  id: string; nome: string; tipo: string;
  conteudoHtml: string; variaveis: string[]; ativo: boolean;
}

interface VariableOption {
  value: string;
  label: string;
}

@Component({
  selector: 'lync-templates-list',
  imports: [FormsModule, PageHeaderComponent, EntityDialogComponent, AppButtonComponent, FormFieldComponent],
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
  private lastEditorRange: Range | null = null;

  readonly templates = signal<Template[]>([]);
  readonly loading = signal(false);

  // Editor state
  readonly editing = signal<Template | null>(null);
  readonly saving = signal(false);
  readonly editName = signal('');
  readonly editHtml = signal('');
  readonly editTipo = signal('CONTRATO_LOCACAO');
  readonly editSelectedVars = signal<string[]>([]);
  readonly editVariableToAdd = signal('');
  readonly draggingOverEditor = signal(false);
  readonly linkPanelOpen = signal(false);
  readonly linkUrl = signal('');
  readonly linkText = signal('');

  // Create template dialog
  readonly createDialogOpen = signal(false);
  readonly creating = signal(false);
  readonly createName = signal('');
  readonly createTipo = signal('CONTRATO_LOCACAO');
  readonly createContent = signal('<h2>Novo template</h2><p>{{nomeCliente}}</p>');
  readonly createSelectedVars = signal<string[]>(['nomeCliente']);
  readonly createVariableToAdd = signal('');

  // Preview
  readonly previewHtml = signal<SafeHtml | null>(null);
  readonly previewVars = signal('{}');
  readonly previewing = signal(false);
  readonly isMock = environment.mock;
  readonly variableList = computed(() => this.editSelectedVars());
  readonly availableEditVariableOptions = computed(() => this.availableVariablesForType(this.editTipo()).filter((option) => !this.editSelectedVars().includes(option.value)));
  readonly availableCreateVariableOptions = computed(() => this.availableVariablesForType(this.createTipo()).filter((option) => !this.createSelectedVars().includes(option.value)));

  readonly templateTypeOptions: Array<{ value: string; label: string }> = [
    { value: 'CONTRATO_LOCACAO', label: 'Contrato de Locação' },
    { value: 'RECIBO_LOCACAO', label: 'Recibo de Locação' },
    { value: 'RECIBO_LAVAGEM', label: 'Recibo de Lavagem' },
    { value: 'VISTORIA', label: 'Termo de Vistoria' },
    { value: 'TERMO_RESPONSABILIDADE', label: 'Termo de Responsabilidade' },
  ];

  readonly variableCatalog: Record<string, VariableOption[]> = {
    CONTRATO_LOCACAO: [
      { value: 'nomeCliente', label: 'Cliente - nome' },
      { value: 'cpfCnpj', label: 'Cliente - CPF/CNPJ' },
      { value: 'emailCliente', label: 'Cliente - e-mail' },
      { value: 'telefoneCliente', label: 'Cliente - telefone' },
      { value: 'veiculo', label: 'Veículo - modelo' },
      { value: 'placa', label: 'Veículo - placa' },
      { value: 'categoria', label: 'Veículo - categoria' },
      { value: 'dataRetirada', label: 'Locação - retirada' },
      { value: 'dataDevolucao', label: 'Locação - devolução' },
      { value: 'valorDiaria', label: 'Locação - valor diária' },
      { value: 'valorTotal', label: 'Locação - valor total' },
    ],
    RECIBO_LOCACAO: [
      { value: 'nomeCliente', label: 'Cliente - nome' },
      { value: 'cpfCnpj', label: 'Cliente - CPF/CNPJ' },
      { value: 'veiculo', label: 'Veículo - modelo' },
      { value: 'placa', label: 'Veículo - placa' },
      { value: 'data', label: 'Recibo - data' },
      { value: 'valor', label: 'Recibo - valor pago' },
      { value: 'formaPagamento', label: 'Recibo - forma de pagamento' },
    ],
    RECIBO_LAVAGEM: [
      { value: 'nomeCliente', label: 'Cliente - nome' },
      { value: 'telefoneCliente', label: 'Cliente - telefone' },
      { value: 'servico', label: 'Lavagem - serviço' },
      { value: 'placa', label: 'Veículo - placa' },
      { value: 'data', label: 'Lavagem - data' },
      { value: 'valor', label: 'Lavagem - valor' },
    ],
    VISTORIA: [
      { value: 'nomeCliente', label: 'Cliente - nome' },
      { value: 'veiculo', label: 'Veículo - modelo' },
      { value: 'placa', label: 'Veículo - placa' },
      { value: 'km', label: 'Vistoria - KM' },
      { value: 'data', label: 'Vistoria - data' },
      { value: 'tipo', label: 'Vistoria - tipo' },
    ],
    TERMO_RESPONSABILIDADE: [
      { value: 'nomeCliente', label: 'Cliente - nome' },
      { value: 'cpfCnpj', label: 'Cliente - CPF/CNPJ' },
      { value: 'veiculo', label: 'Veículo - modelo' },
      { value: 'placa', label: 'Veículo - placa' },
      { value: 'dataRetirada', label: 'Locação - retirada' },
      { value: 'dataDevolucao', label: 'Locação - devolução' },
      { value: 'valorTotal', label: 'Locação - valor total' },
    ],
  };

  readonly tipoLabel: Record<string, string> = {
    CONTRATO_LOCACAO: 'Contrato de Locação',
    RECIBO_LAVAGEM: 'Recibo Lavagem',
    RECIBO_LOCACAO: 'Recibo Locação',
    VISTORIA: 'Termo de Vistoria',
    TERMO_RESPONSABILIDADE: 'Termo de Responsabilidade',
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
    this.editTipo.set(t.tipo);
    this.editHtml.set(t.conteudoHtml);
    this.editSelectedVars.set(t.variaveis);
    this.editVariableToAdd.set('');
    this.previewHtml.set(null);
    this.previewVars.set(this.buildPreviewSeedJson(t.variaveis));

    afterNextRender(() => {
      this.setEditorContent(t.conteudoHtml);
    }, { injector: this.injector });
  }

  onSave() {
    if (!this.editName().trim() || !this.editSelectedVars().length) {
      return;
    }
    this.syncEditorToModel();
    this.saving.set(true);
    const vars = this.editSelectedVars();
    this.api.patch(`/templates/${this.editing()!.id}`, {
      nome: this.editName(),
      tipo: this.editTipo(),
      conteudoHtml: this.editHtml(),
      variaveis: vars,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.editing.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  openCreateDialog() {
    this.createName.set('');
    this.createTipo.set('CONTRATO_LOCACAO');
    this.createContent.set('<h2>Novo template</h2><p>{{nomeCliente}}</p>');
    this.createSelectedVars.set(['nomeCliente']);
    this.createVariableToAdd.set('');
    this.createDialogOpen.set(true);
  }

  closeCreateDialog() {
    this.createDialogOpen.set(false);
  }

  onCreateTemplate() {
    if (!this.createName().trim() || !this.createSelectedVars().length) {
      return;
    }
    this.creating.set(true);
    const payload = {
      nome: this.createName().trim(),
      tipo: this.createTipo(),
      conteudoHtml: this.createContent(),
      variaveis: this.createSelectedVars(),
      ativo: true,
    };

    this.api.post<Template>('/templates', payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.creating.set(false);
          this.createDialogOpen.set(false);
          this.load();
          this.startEdit(created);
        },
        error: () => {
          this.creating.set(false);
        },
      });
  }

  onEditTipoChange(tipo: string) {
    this.editTipo.set(tipo);
    const allowed = new Set(this.availableVariablesForType(tipo).map((item) => item.value));
    this.editSelectedVars.update((current) => current.filter((item) => allowed.has(item)));
    this.editVariableToAdd.set('');
  }

  onCreateTipoChange(tipo: string) {
    this.createTipo.set(tipo);
    const allowed = new Set(this.availableVariablesForType(tipo).map((item) => item.value));
    this.createSelectedVars.update((current) => {
      const filtered = current.filter((item) => allowed.has(item));
      return filtered.length ? filtered : ['nomeCliente'];
    });
    this.createVariableToAdd.set('');
  }

  addEditVariable() {
    const value = this.editVariableToAdd();
    if (!value) {
      return;
    }
    this.editSelectedVars.update((current) => current.includes(value) ? current : [...current, value]);
    this.editVariableToAdd.set('');
    this.previewVars.set(this.buildPreviewSeedJson(this.editSelectedVars()));
  }

  removeEditVariable(variable: string) {
    this.editSelectedVars.update((current) => current.filter((item) => item !== variable));
    this.previewVars.set(this.buildPreviewSeedJson(this.editSelectedVars()));
  }

  addCreateVariable() {
    const value = this.createVariableToAdd();
    if (!value) {
      return;
    }
    this.createSelectedVars.update((current) => current.includes(value) ? current : [...current, value]);
    this.createVariableToAdd.set('');
  }

  removeCreateVariable(variable: string) {
    this.createSelectedVars.update((current) => current.filter((item) => item !== variable));
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
    this.captureEditorSelection();
    this.syncEditorToModel();
  }

  onEditorSelectionChange() {
    this.captureEditorSelection();
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
    this.placeCaretFromPoint(event.clientX, event.clientY);
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

    this.restoreEditorSelection(selection, editor);

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
    this.lastEditorRange = range.cloneRange();
    this.syncEditorToModel();
  }

  private placeCaretFromPoint(x: number, y: number) {
    const editor = this.richEditor()?.nativeElement;
    if (!editor) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const doc = document as Document & {
      caretRangeFromPoint?: (px: number, py: number) => Range | null;
      caretPositionFromPoint?: (px: number, py: number) => { offsetNode: Node; offset: number } | null;
    };

    let range: Range | null = null;
    if (typeof doc.caretRangeFromPoint === 'function') {
      range = doc.caretRangeFromPoint(x, y);
    } else if (typeof doc.caretPositionFromPoint === 'function') {
      const position = doc.caretPositionFromPoint(x, y);
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
      }
    }

    if (!range || !this.isRangeInsideEditor(range, editor)) {
      this.placeCaretAtEnd(editor, selection);
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
    this.lastEditorRange = range.cloneRange();
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
    this.lastEditorRange = range.cloneRange();
  }

  private captureEditorSelection() {
    const editor = this.richEditor()?.nativeElement;
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!this.isRangeInsideEditor(range, editor)) {
      return;
    }

    this.lastEditorRange = range.cloneRange();
  }

  private restoreEditorSelection(selection: Selection, editor: HTMLDivElement) {
    if (!this.lastEditorRange || !this.isRangeInsideEditor(this.lastEditorRange, editor)) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(this.lastEditorRange.cloneRange());
  }

  private isRangeInsideEditor(range: Range, editor: HTMLDivElement): boolean {
    return editor.contains(range.startContainer) && editor.contains(range.endContainer);
  }

  private availableVariablesForType(tipo: string): VariableOption[] {
    return this.variableCatalog[tipo] ?? this.variableCatalog['CONTRATO_LOCACAO'];
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
