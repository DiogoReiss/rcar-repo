import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { Vehicle, Customer, RentalContract } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import WizardDialogComponent from '@shared/components/wizard-dialog/wizard-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';
import DateBrPipe from '@shared/pipes/date-br.pipe';

@Component({
  selector: 'lync-disponibilidade',
  imports: [FormsModule, PageHeaderComponent, WizardDialogComponent, AppButtonComponent, FormFieldComponent, CurrencyBrlPipe, DateBrPipe],
  templateUrl: './disponibilidade.html',
  styleUrl: './disponibilidade.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DisponibilidadeComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly router = inject(Router);

  // ── Wizard state ────────────────────────────────────────────────────────────
  readonly wizardVisible = signal(false);
  readonly wizardStep    = signal(0);
  readonly wizardSteps   = ['Período', 'Veículo', 'Detalhes'];

  // ── Step 1 – date search ─────────────────────────────────────────────────
  readonly dateFrom  = signal(new Date().toISOString().slice(0, 10));
  readonly dateTo    = signal(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  readonly searching = signal(false);
  readonly available = signal<Vehicle[]>([]);
  readonly searched  = signal(false);

  // ── Step 2 – vehicle pick ────────────────────────────────────────────────
  readonly selectedVehicle = signal<Vehicle | null>(null);

  // ── Step 3 – reservation details ────────────────────────────────────────
  readonly customers  = signal<Customer[]>([]);
  readonly customerId = signal('');
  readonly modalidade = signal<string>('DIARIA');
  readonly valorDiaria = signal(0);
  readonly seguro     = signal(false);
  readonly valorSeguro = signal(0);
  readonly kmLimite   = signal<number | undefined>(undefined);
  readonly obs        = signal('');
  readonly saving     = signal(false);
  readonly error      = signal<string | null>(null);

  readonly modalidades = ['DIARIA', 'SEMANAL', 'MENSAL'];
  readonly modalidadeLabels: Record<string, string> = {
    DIARIA: 'Diária', SEMANAL: 'Semanal', MENSAL: 'Mensal',
  };

  // ── Existing rentals list ────────────────────────────────────────────────
  readonly contracts        = signal<RentalContract[]>([]);
  readonly contractsLoading = signal(false);

  readonly statusLabels: Record<string, string> = {
    RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado',
  };
  readonly statusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--success',
    ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  // ── Wizard navigation guards ─────────────────────────────────────────────
  readonly canProceed = computed(() => {
    switch (this.wizardStep()) {
      case 0: return this.searched() && !!this.available().length;
      case 1: return !!this.selectedVehicle();
      case 2: return !!this.customerId() && this.valorDiaria() > 0;
      default: return false;
    }
  });

  ngOnInit() {
    this.loadCustomers();
    this.loadContracts();
  }

  async loadCustomers() {
    try {
      const res = await firstValueFrom(this.api.get<{ data: Customer[] } | Customer[]>('/customers'));
      this.customers.set(Array.isArray(res) ? res : (res as any).data ?? []);
    } catch { /* silent */ }
  }

  async loadContracts() {
    this.contractsLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<{ data: RentalContract[] }>('/rental/contracts?page=1&perPage=20'));
      this.contracts.set((res as any).data ?? []);
    } catch { /* silent */ } finally {
      this.contractsLoading.set(false);
    }
  }

  openWizard() {
    this.wizardStep.set(0);
    this.searched.set(false);
    this.available.set([]);
    this.selectedVehicle.set(null);
    this.customerId.set('');
    this.modalidade.set('DIARIA');
    this.valorDiaria.set(0);
    this.seguro.set(false);
    this.valorSeguro.set(0);
    this.kmLimite.set(undefined);
    this.obs.set('');
    this.error.set(null);
    this.wizardVisible.set(true);
  }

  async onNext() {
    if (this.wizardStep() === 0 && !this.searched()) {
      await this.onSearch();
    }
    if (this.canProceed()) {
      this.wizardStep.update(s => s + 1);
    }
  }

  onPrev() { this.wizardStep.update(s => s - 1); }

  resetWizard() { this.wizardVisible.set(false); }

  async onSearch() {
    if (!this.dateFrom() || !this.dateTo()) return;
    this.searching.set(true); this.available.set([]); this.searched.set(false);
    try {
      const res = await firstValueFrom(this.api.get<Vehicle[]>(
        `/rental/available?dataRetirada=${this.dateFrom()}T00:00:00Z&dataDevolucao=${this.dateTo()}T23:59:59Z`
      ));
      this.available.set(Array.isArray(res) ? res : (res as any).data ?? []);
      this.searched.set(true);
    } finally { this.searching.set(false); }
  }

  selectVehicle(v: Vehicle) {
    this.selectedVehicle.set(v);
    this.wizardStep.set(2);
  }

  async onCreateReservation() {
    if (!this.selectedVehicle() || !this.customerId()) return;
    this.saving.set(true); this.error.set(null);
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
      this.wizardVisible.set(false);
      this.loadContracts();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao criar reserva.');
    } finally { this.saving.set(false); }
  }

  catLabel(c: string) {
    return ({
      ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário',
      SUV: 'SUV', EXECUTIVO: 'Executivo', UTILITARIO: 'Utilitário',
    } as Record<string, string>)[c] ?? c;
  }

  goToDetail(id: string) { this.router.navigate(['/aluguel/contratos', id]); }
}
