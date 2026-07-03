import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { FilaQueueFacade } from '../fila-queue-facade';
import { ApiService } from '@core/services/api.service';
import { PaymentMethod, WashQueueEntry } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import PaymentDialogComponent from '@shared/components/payment-dialog/payment-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

type TemplateType = 'RECIBO_LAVAGEM';

interface TemplateRef {
  id: string;
  tipo: string;
}

@Component({
  selector: 'lync-fila-painel',
  imports: [
    FormsModule,
    PageHeaderComponent,
    PaymentDialogComponent,
    Dialog,
    AppButtonComponent,
    FormFieldComponent,
    CurrencyBrlPipe,
  ],
  templateUrl: './fila-painel.html',
  styleUrl: './fila-painel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FilaQueueFacade],
})
export default class FilaPainelComponent {
  protected readonly fila = inject(FilaQueueFacade);
  private readonly api = inject(ApiService);
  private readonly toast = inject(MessageService);

  // Detail dialog
  readonly detailItem = signal<WashQueueEntry | null>(null);

  // Add dialog
  readonly addDialogVisible = signal(false);
  readonly addMode = signal<'avulso' | 'cadastrado'>('avulso');
  readonly addSaving = signal(false);
  readonly addNome = signal('');
  readonly addPlaca = signal('');
  readonly addClienteId = signal('');
  readonly addServiceId = signal('');

  // Payment dialog
  readonly payingId = signal<string | null>(null);
  readonly payLoading = signal(false);
  readonly pdfLoadingId = signal<string | null>(null);

  // Drag state
  private draggedId = '';
  private draggedStatus = '';
  readonly dragOverCol = signal<string | null>(null);
  private readonly templateIdByType = new Map<TemplateType, string>();

  constructor() {
    effect(() => {
      const services = this.fila.services();
      if (services.length && !untracked(this.addServiceId)) {
        this.addServiceId.set(services[0].id);
      }
    });
    this.fila.init();
  }

  // ─── Add dialog ───────────────────────────────────────────────────
  openAddDialog() {
    this.addMode.set('avulso');
    this.addNome.set('');
    this.addPlaca.set('');
    this.addClienteId.set('');
    this.addDialogVisible.set(true);
  }

  closeAddDialog() {
    this.addDialogVisible.set(false);
  }

  get canSubmitAdd(): boolean {
    if (!this.addServiceId()) return false;
    return this.addMode() === 'avulso' ? !!this.addNome().trim() : !!this.addClienteId();
  }

  async onSubmitAdd() {
    if (!this.canSubmitAdd) return;
    this.addSaving.set(true);
    try {
      await this.fila.add({
        nomeAvulso: this.addMode() === 'avulso' ? this.addNome().trim() : undefined,
        customerId: this.addMode() === 'cadastrado' ? this.addClienteId() : undefined,
        serviceId: this.addServiceId(),
        veiculoPlaca: this.addPlaca().trim() || undefined,
      });
      this.toast.add({ severity: 'success', summary: 'Adicionado à fila', life: 3000 });
      this.closeAddDialog();
    } finally {
      this.addSaving.set(false);
    }
  }

  // ─── Detail dialog ────────────────────────────────────────────────
  openDetail(q: WashQueueEntry) { this.detailItem.set(q); }
  closeDetail()                 { this.detailItem.set(null); }

  get detailCanAdvance(): boolean {
    return this.fila.canAdvance(this.detailItem()?.status);
  }

  get detailCanPay(): boolean {
    return this.fila.canPay(this.detailItem()?.status);
  }

  get detailCanGeneratePdf(): boolean {
    const status = this.detailItem()?.status;
    return status === 'EM_ATENDIMENTO' || status === 'CONCLUIDO';
  }

  async onAdvanceDetail() {
    const item = this.detailItem();
    if (!item) return;
    await this.onAdvance(item.id);
    const updated = this.fila.entry(item.id);
    if (updated) this.detailItem.set(updated); else this.closeDetail();
  }

  openPayFromDetail() {
    const item = this.detailItem();
    if (item) { this.payingId.set(item.id); this.closeDetail(); }
  }

  // ─── Queue actions ────────────────────────────────────────────────
  async onAdvance(id: string) {
    await this.fila.advance(id);
    this.toast.add({ severity: 'success', summary: 'Status atualizado', life: 3000 });
  }

  async onPay(metodo: PaymentMethod) {
    const id = this.payingId();
    if (!id) return;
    this.payLoading.set(true);
    try {
      await this.fila.pay(id, metodo);
      this.payingId.set(null);
      this.toast.add({ severity: 'success', summary: 'Pagamento registrado', life: 3000 });
    } finally {
      this.payLoading.set(false);
    }
  }

  // ─── Drag & drop ─────────────────────────────────────────────────
  onDragStart(event: DragEvent, q: WashQueueEntry) {
    this.draggedId     = q.id;
    this.draggedStatus = q.status;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, col: string) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverCol.set(col);
  }

  onDragLeave() { this.dragOverCol.set(null); }

  async onDrop(event: DragEvent, targetStatus: string) {
    event.preventDefault();
    this.dragOverCol.set(null);
    const moved = await this.fila.advanceTo(this.draggedId, this.draggedStatus, targetStatus);
    if (moved) this.toast.add({ severity: 'success', summary: 'Status atualizado', life: 3000 });
    this.draggedId = this.draggedStatus = '';
  }

  // ─── Receipt PDF ──────────────────────────────────────────────────
  private async resolveTemplateId(tipo: TemplateType): Promise<string | null> {
    const cached = this.templateIdByType.get(tipo);
    if (cached) return cached;

    const templates = await firstValueFrom(this.api.get<TemplateRef[]>('/templates'));
    const match = templates.find((template) => template.tipo === tipo);
    if (!match) return null;
    this.templateIdByType.set(tipo, match.id);
    return match.id;
  }

  private triggerPdfDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async onGenerateReceiptPdf() {
    const item = this.detailItem();
    if (!item) return;

    this.pdfLoadingId.set(item.id);
    try {
      const templateId = await this.resolveTemplateId('RECIBO_LAVAGEM');
      if (!templateId) {
        this.toast.add({
          severity: 'warn',
          summary: 'Template não encontrado',
          detail: 'Cadastre um template RECIBO_LAVAGEM para gerar o recibo.',
          life: 4000,
        });
        return;
      }

      const payload = {
        variables: {
          atendimentoId: item.id,
          cliente: item.customer?.nome ?? item.nomeAvulso ?? 'Cliente',
          servico: item.service?.nome ?? 'Serviço',
          placa: item.veiculoPlaca ?? '—',
          status: this.statusLabel[item.status] ?? item.status,
          valor: item.service?.preco ? `R$ ${Number(item.service.preco).toFixed(2)}` : '—',
          dataEntrada: this.formatEntryTime(item.createdAt),
        },
        fileName: `recibo-lavajato-${item.id.slice(0, 8)}`,
      };

      const blob = await firstValueFrom(this.api.postBlob(`/documents/templates/${templateId}/pdf`, payload));
      this.triggerPdfDownload(blob, `${payload.fileName}.pdf`);
      this.toast.add({ severity: 'success', summary: 'Recibo PDF gerado', life: 3000 });
    } catch (e: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Erro ao gerar recibo',
        detail: e?.error?.message ?? 'Não foi possível gerar o PDF.',
        life: 4000,
      });
    } finally {
      this.pdfLoadingId.set(null);
    }
  }

  // ─── Formatters ───────────────────────────────────────────────────
  formatEntryTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  readonly statusLabel: Record<string, string> = {
    AGUARDANDO: 'Aguardando', EM_ATENDIMENTO: 'Em Atendimento', CONCLUIDO: 'Concluído',
  };
  readonly statusBadgeClass: Record<string, string> = {
    AGUARDANDO: 'badge--warning', EM_ATENDIMENTO: 'badge--operador', CONCLUIDO: 'badge--success',
  };
}
