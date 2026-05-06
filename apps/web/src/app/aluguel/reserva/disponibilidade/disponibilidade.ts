import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { Vehicle, Customer, RentalContract } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';

@Component({
  selector: 'lync-disponibilidade',
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './disponibilidade.html',
  styleUrl: './disponibilidade.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DisponibilidadeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  // Search form
  readonly dateFrom = signal(new Date().toISOString().slice(0, 10));
  readonly dateTo = signal(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  readonly searching = signal(false);
  readonly available = signal<Vehicle[]>([]);
  readonly searched = signal(false);

  // Reservation form
  readonly selectedVehicle = signal<Vehicle | null>(null);
  readonly customers = signal<Customer[]>([]);
  readonly customerId = signal('');
  readonly modalidade = signal<string>('DIARIA');
  readonly valorDiaria = signal(0);
  readonly seguro = signal(false);
  readonly valorSeguro = signal(0);
  readonly kmLimite = signal<number | undefined>(undefined);
  readonly obs = signal('');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly modalidades = ['DIARIA', 'SEMANAL', 'MENSAL'];

  ngOnInit() { this.loadCustomers(); }

  async loadCustomers() {
    try {
      const res = await firstValueFrom(this.api.get<Customer[]>('/customers'));
      this.customers.set(res);
    } catch { /* silent */ }
  }

  async onSearch() {
    if (!this.dateFrom() || !this.dateTo()) return;
    this.searching.set(true); this.available.set([]); this.searched.set(false);
    try {
      const res = await firstValueFrom(this.api.get<Vehicle[]>(
        `/rental/available?dataRetirada=${this.dateFrom()}T00:00:00Z&dataDevolucao=${this.dateTo()}T23:59:59Z`
      ));
      this.available.set(res);
      this.searched.set(true);
    } finally { this.searching.set(false); }
  }

  selectVehicle(v: Vehicle) {
    this.selectedVehicle.set(v);
    this.error.set(null);
  }

  async onCreateReservation() {
    if (!this.selectedVehicle() || !this.customerId()) return;
    this.saving.set(true); this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.post<RentalContract>('/rental/contracts', {
        customerId: this.customerId(),
        vehicleId: this.selectedVehicle()!.id,
        modalidade: this.modalidade(),
        dataRetirada: `${this.dateFrom()}T00:00:00.000Z`,
        dataDevolucao: `${this.dateTo()}T23:59:59.000Z`,
        valorDiaria: this.valorDiaria(),
        seguro: this.seguro(),
        valorSeguro: this.seguro() ? this.valorSeguro() : undefined,
        kmLimite: this.kmLimite() || undefined,
        observacoes: this.obs() || undefined,
      }));
      this.router.navigate(['/aluguel/contratos']);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao criar reserva.');
    } finally { this.saving.set(false); }
  }

  catLabel(c: string) { return ({ ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário', SUV: 'SUV', EXECUTIVO: 'Executivo', UTILITARIO: 'Utilitário' } as any)[c] ?? c; }
}
