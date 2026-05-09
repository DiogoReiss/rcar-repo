import {
  ChangeDetectionStrategy, Component, inject, signal, computed, OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import type { RowMenuItem } from '@shared/components/row-menu/row-menu';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import {
  RentalContract, PaginatedResponse, PaymentMethod, Vehicle, Customer,
} from '@shared/models/entities.model';
import ConfirmDialogComponent from '@shared/components/confirm-dialog/confirm-dialog';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import FormFieldComponent from '@shared/components/form-field/form-field';
import PaymentDialogComponent from '@shared/components/payment-dialog/payment-dialog';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import RowMenuComponent from '@shared/components/row-menu/row-menu';
import WizardDialogComponent from '@shared/components/wizard-dialog/wizard-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';
import DateBrPipe from '@shared/pipes/date-br.pipe';

type TabKey = 'TODOS' | 'RESERVADO' | 'ATIVO' | 'HISTORICO';
type TemplateType = 'CONTRATO_LOCACAO' | 'RECIBO_LOCACAO';

interface TemplateRef {
  id: string;
  tipo: string;
}

@Component({
  selector: 'lync-contrato-list',
  imports: [
    FormsModule,
    ConfirmDialogComponent, EntityDialogComponent, FormFieldComponent,
    PaymentDialogComponent, PageHeaderComponent, RowMenuComponent,
    WizardDialogComponent, AppButtonComponent, CurrencyBrlPipe, DateBrPipe, Dialog,
  ],
  templateUrl: './contrato-list.html',
  styleUrl: './contrato-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ContratoListComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly toast  = inject(MessageService);

  // ── List state ────────────────────────────────────────────────────────────
  readonly contracts = signal<RentalContract[]>([]);
  readonly loading   = signal(false);
  readonly error     = signal<string | null>(null);

  readonly activeTab  = signal<TabKey>('TODOS');
  readonly tabs: { key: TabKey; label: string }[] = [
    { key: 'TODOS',     label: 'Todos' },
    { key: 'RESERVADO', label: 'Reservados' },
    { key: 'ATIVO',     label: 'Ativos' },
    { key: 'HISTORICO', label: 'Histórico' },
  ];

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const all  = this.contracts();
    if (tab === 'TODOS')     return all;
    if (tab === 'HISTORICO') return all.filter(c => c.status === 'ENCERRADO' || c.status === 'CANCELADO');
    return all.filter(c => c.status === tab);
  });

  readonly tabCounts = computed(() => {
    const all = this.contracts();
    return {
      TODOS:     all.length,
      RESERVADO: all.filter(c => c.status === 'RESERVADO').length,
      ATIVO:     all.filter(c => c.status === 'ATIVO').length,
      HISTORICO: all.filter(c => c.status === 'ENCERRADO' || c.status === 'CANCELADO').length,
    };
  });

  // ── Abertura dialog ───────────────────────────────────────────────────────
  readonly aberturaTarget   = signal<string | null>(null);
  readonly aberturaLoading  = signal(false);
  readonly kmRetirada       = signal(0);
  readonly combustivelSaida = signal('CHEIO');

  // ── Payment dialog ────────────────────────────────────────────────────────
  readonly payingId   = signal<string | null>(null);
  readonly payLoading = signal(false);
  readonly pdfLoadingId = signal<string | null>(null);

  // ── Detail dialog ─────────────────────────────────────────────────────────
  readonly detailId      = signal<string | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError   = signal<string | null>(null);
  readonly detailData    = signal<RentalContract | null>(null);

  // ── Devolução dialog ──────────────────────────────────────────────────────
  readonly devolucaoId      = signal<string | null>(null);
  readonly devolucaoLoading = signal(false);
  readonly devolucaoSaving  = signal(false);
  readonly devolucaoError   = signal<string | null>(null);
  readonly devolucaoData    = signal<RentalContract | null>(null);
  readonly kmDevolucao      = signal(0);
  readonly combustivelChegada = signal('CHEIO');
  readonly devolucaoObs = signal('');
  readonly checklistItems = ['Lataria', 'Para-choque', 'Retrovisores', 'Vidros', 'Pneus', 'Interior', 'Documentos'];
  readonly checklist = signal<Record<string, boolean>>({});

  // ── Cancel confirm ────────────────────────────────────────────────────────
  readonly cancelTarget = signal<string | null>(null);

  // ── Wizard state ──────────────────────────────────────────────────────────
  readonly wizardVisible = signal(false);
  readonly wizardStep    = signal(0);
  readonly wizardSteps   = ['Período', 'Veículo', 'Detalhes'];

  readonly dateFrom  = signal(new Date().toISOString().slice(0, 10));
  readonly dateTo    = signal(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  readonly searching = signal(false);
  readonly available = signal<Vehicle[]>([]);
  readonly searched  = signal(false);

  readonly selectedVehicle = signal<Vehicle | null>(null);

  readonly customers   = signal<Customer[]>([]);
  readonly customerId  = signal('');
  readonly modalidade  = signal<string>('DIARIA');
  readonly valorDiaria = signal(0);
  readonly seguro      = signal(false);
  readonly valorSeguro = signal(0);
  readonly kmLimite    = signal<number | undefined>(undefined);
  readonly obs         = signal('');
  readonly saving      = signal(false);
  readonly wizardError = signal<string | null>(null);

  readonly modalidades = ['DIARIA', 'SEMANAL', 'MENSAL'];
  readonly modalidadeLabels: Record<string, string> = {
    DIARIA: 'Diária', SEMANAL: 'Semanal', MENSAL: 'Mensal',
  };

  readonly canProceed = computed(() => {
    switch (this.wizardStep()) {
      case 0: return this.searched() && !!this.available().length;
      case 1: return !!this.selectedVehicle();
      case 2: return !!this.customerId() && this.valorDiaria() > 0;
      default: return false;
    }
  });

  // ── Status display ────────────────────────────────────────────────────────
  readonly statusLabel: Record<string, string> = {
    RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado',
  };
  readonly statusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--success',
    ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  private readonly templateIdByType = new Map<TemplateType, string>();

  ngOnInit() {
    this.load();
    this.loadCustomers();
  }

  async load() {
    this.loading.set(true); this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.get<PaginatedResponse<RentalContract>>('/rental/contracts?page=1&perPage=50'),
      );
      this.contracts.set((res as any).data ?? res);
    } catch { this.error.set('Erro ao carregar contratos.'); }
    finally { this.loading.set(false); }
  }

  async loadCustomers() {
    try {
      const res = await firstValueFrom(this.api.get<{ data: Customer[] } | Customer[]>('/customers'));
      this.customers.set(Array.isArray(res) ? res : (res as any).data ?? []);
    } catch { /* silent */ }
  }

  setTab(key: TabKey) { this.activeTab.set(key); }

  getRowMenuItems(c: RentalContract): RowMenuItem[] {
    const items: RowMenuItem[] = [];
    items.push({ label: 'Ver detalhes', icon: 'pi pi-eye', command: () => this.openDetail(c.id) });
    if (c.status === 'ENCERRADO' || c.status === 'ATIVO') {
      items.push({
        label: c.status === 'ENCERRADO' ? 'Gerar Recibo PDF' : 'Gerar Contrato PDF',
        icon: 'pi pi-file-pdf',
        command: () => this.onGenerateContractPdf(c),
      });
    }
    if (c.status === 'RESERVADO') {
      items.push(
        { label: 'Abrir contrato', icon: 'pi pi-play',          command: () => { this.aberturaTarget.set(c.id); this.kmRetirada.set(0); this.combustivelSaida.set('CHEIO'); } },
        { label: 'Cancelar',       icon: 'pi pi-times-circle', danger: true, command: () => this.cancelTarget.set(c.id) },
      );
    }
    if (c.status === 'ATIVO') {
      items.push(
        { label: 'Registrar devolução', icon: 'pi pi-undo',        command: () => this.openDevolucao(c.id) },
        { label: 'Registrar pagamento', icon: 'pi pi-credit-card', command: () => this.payingId.set(c.id) },
      );
    }
    return items;
  }

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

  async onGenerateContractPdf(contract: RentalContract) {
    const templateType: TemplateType = contract.status === 'ENCERRADO' ? 'RECIBO_LOCACAO' : 'CONTRATO_LOCACAO';
    this.pdfLoadingId.set(contract.id);
    try {
      const templateId = await this.resolveTemplateId(templateType);
      if (!templateId) {
        this.toast.add({
          severity: 'warn',
          summary: 'Template não encontrado',
          detail: 'Cadastre o template correspondente para gerar o PDF.',
          life: 4000,
        });
        return;
      }

      const payload = {
        variables: {
          contratoId: contract.id,
          status: this.statusLabel[contract.status] ?? contract.status,
          nomeCliente: contract.customer?.nome ?? 'Cliente',
          placaVeiculo: contract.vehicle?.placa ?? '—',
          modeloVeiculo: contract.vehicle?.modelo ?? '—',
          dataRetirada: this.formatDate(contract.dataRetirada),
          dataDevolucao: this.formatDate(contract.dataDevolucao),
          valorTotal: this.formatPrice(contract.valorTotalReal ?? contract.valorTotal),
        },
        fileName: `${templateType === 'RECIBO_LOCACAO' ? 'recibo' : 'contrato'}-${contract.id.slice(0, 8)}`,
      };

      const blob = await firstValueFrom(this.api.postBlob(`/documents/templates/${templateId}/pdf`, payload));
      this.triggerPdfDownload(blob, `${payload.fileName}.pdf`);
      this.toast.add({ severity: 'success', summary: 'PDF gerado', life: 2500 });
    } catch (e: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Erro ao gerar PDF',
        detail: e?.error?.message ?? 'Não foi possível gerar o documento.',
        life: 4000,
      });
    } finally {
      this.pdfLoadingId.set(null);
    }
  }

  async openDetail(id: string) {
    this.detailId.set(id);
    this.detailLoading.set(true);
    this.detailError.set(null);
    this.detailData.set(null);
    try {
      const res = await firstValueFrom(this.api.get<RentalContract>(`/rental/contracts/${id}`));
      this.detailData.set(res);
    } catch {
      this.detailError.set('Contrato não encontrado.');
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail() {
    this.detailId.set(null);
    this.detailData.set(null);
    this.detailError.set(null);
  }

  async openDevolucao(id: string) {
    this.devolucaoId.set(id);
    this.devolucaoLoading.set(true);
    this.devolucaoError.set(null);
    this.devolucaoData.set(null);

    const initial: Record<string, boolean> = {};
    this.checklistItems.forEach((i) => { initial[i] = true; });
    this.checklist.set(initial);
    this.combustivelChegada.set('CHEIO');
    this.devolucaoObs.set('');

    try {
      const res = await firstValueFrom(this.api.get<RentalContract>(`/rental/contracts/${id}`));
      this.devolucaoData.set(res);
      this.kmDevolucao.set(res.vehicle?.kmAtual ?? 0);
    } catch {
      this.devolucaoError.set('Não foi possível carregar o contrato para devolução.');
    } finally {
      this.devolucaoLoading.set(false);
    }
  }

  closeDevolucao() {
    this.devolucaoId.set(null);
    this.devolucaoData.set(null);
    this.devolucaoError.set(null);
  }

  toggleChecklist(item: string) {
    this.checklist.update((c) => ({ ...c, [item]: !c[item] }));
  }

  async onSubmitDevolucao() {
    const id = this.devolucaoId();
    if (!id) return;
    this.devolucaoSaving.set(true);
    this.devolucaoError.set(null);
    try {
      await firstValueFrom(this.api.patch(`/rental/contracts/${id}/close`, {
        kmDevolucao: this.kmDevolucao(),
        combustivelChegada: this.combustivelChegada(),
        checklist: this.checklist(),
        observacoes: this.devolucaoObs() || undefined,
      }));
      this.toast.add({ severity: 'success', summary: 'Devolução registrada', life: 3000 });
      this.closeDevolucao();
      await this.load();
    } catch (e: any) {
      this.devolucaoError.set(e?.error?.message ?? 'Erro ao registrar devolução.');
    } finally {
      this.devolucaoSaving.set(false);
    }
  }

  // ── Abertura ──────────────────────────────────────────────────────────────
  async onAbertura() {
    const id = this.aberturaTarget();
    if (!id) return;
    this.aberturaLoading.set(true);
    try {
      await firstValueFrom(this.api.patch(`/rental/contracts/${id}/open`, {
        kmRetirada: this.kmRetirada(),
        combustivelSaida: this.combustivelSaida(),
        checklist: {},
      }));
      this.toast.add({ severity: 'success', summary: 'Contrato aberto', life: 3000 });
      this.aberturaTarget.set(null);
      await this.load();
    } finally { this.aberturaLoading.set(false); }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  async onConfirmCancel() {
    const id = this.cancelTarget();
    if (!id) return;
    this.cancelTarget.set(null);
    await firstValueFrom(this.api.patch(`/rental/contracts/${id}/cancel`, {}));
    this.toast.add({ severity: 'success', summary: 'Reserva cancelada', life: 3000 });
    await this.load();
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  async onPay(metodo: PaymentMethod) {
    const id = this.payingId();
    if (!id) return;
    this.payLoading.set(true);
    try {
      await firstValueFrom(this.api.post(`/rental/contracts/${id}/payment`, { metodo }));
      this.toast.add({ severity: 'success', summary: 'Pagamento registrado', life: 3000 });
      this.payingId.set(null);
      await this.load();
    } finally { this.payLoading.set(false); }
  }

  // ── Wizard actions ────────────────────────────────────────────────────────
  openWizard() {
    this.wizardStep.set(0);
    this.searched.set(false); this.available.set([]); this.selectedVehicle.set(null);
    this.customerId.set(''); this.modalidade.set('DIARIA'); this.valorDiaria.set(0);
    this.seguro.set(false); this.valorSeguro.set(0); this.kmLimite.set(undefined);
    this.obs.set(''); this.wizardError.set(null);
    this.wizardVisible.set(true);
  }

  async onNext() {
    if (this.wizardStep() === 0 && !this.searched()) await this.onSearch();
    if (this.canProceed()) this.wizardStep.update(s => s + 1);
  }

  onPrev() { this.wizardStep.update(s => s - 1); }
  resetWizard() { this.wizardVisible.set(false); }

  async onSearch() {
    if (!this.dateFrom() || !this.dateTo()) return;
    this.searching.set(true); this.available.set([]); this.searched.set(false);
    try {
      const res = await firstValueFrom(this.api.get<Vehicle[]>(
        `/rental/available?dataRetirada=${this.dateFrom()}T00:00:00Z&dataDevolucao=${this.dateTo()}T23:59:59Z`,
      ));
      this.available.set(Array.isArray(res) ? res : (res as any).data ?? []);
      this.searched.set(true);
    } finally { this.searching.set(false); }
  }

  selectVehicle(v: Vehicle) { this.selectedVehicle.set(v); this.wizardStep.set(2); }

  async onCreateReservation() {
    if (!this.selectedVehicle() || !this.customerId()) return;
    this.saving.set(true); this.wizardError.set(null);
    try {
      await firstValueFrom(this.api.post<RentalContract>('/rental/contracts', {
        customerId:    this.customerId(),
        vehicleId:     this.selectedVehicle()!.id,
        modalidade:    this.modalidade(),
        dataRetirada:  `${this.dateFrom()}T00:00:00.000Z`,
        dataDevolucao: `${this.dateTo()}T23:59:59.000Z`,
        valorDiaria:   this.valorDiaria(),
        seguro:        this.seguro(),
        valorSeguro:   this.seguro() ? this.valorSeguro() : undefined,
        kmLimite:      this.kmLimite() || undefined,
        observacoes:   this.obs() || undefined,
      }));
      this.toast.add({ severity: 'success', summary: 'Reserva criada com sucesso', life: 3000 });
      this.wizardVisible.set(false);
      this.activeTab.set('RESERVADO');
      await this.load();
    } catch (e: any) {
      this.wizardError.set(e?.error?.message ?? 'Erro ao criar reserva.');
    } finally { this.saving.set(false); }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  catLabel(c: string) {
    return ({
      ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário',
      SUV: 'SUV', EXECUTIVO: 'Executivo', UTILITARIO: 'Utilitário',
    } as Record<string, string>)[c] ?? c;
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('pt-BR'); }
  formatDateTime(d: string) { return new Date(d).toLocaleString('pt-BR'); }
  formatPrice(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
  d4signClass(s: string) { return s === 'SIGNED' ? 'badge--success' : s === 'PENDING' ? 'badge--warning' : 'badge--inactive'; }
}
