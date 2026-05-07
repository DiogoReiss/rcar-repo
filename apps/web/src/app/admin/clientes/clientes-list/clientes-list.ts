import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import type { RowMenuItem } from '@shared/components/row-menu/row-menu';
import { DialogModule } from 'primeng/dialog';
import { ApiService } from '@core/services/api.service';
import { ClientesService } from '../clientes.service';
import { Customer, WashSchedule, RentalContract } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import PaginationComponent from '@shared/components/pagination/pagination';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';
import RowMenuComponent from '@shared/components/row-menu/row-menu';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';
import DateBrPipe from '@shared/pipes/date-br.pipe';

interface CustomerHistory {
  customer: Customer;
  schedules: WashSchedule[];
  contracts: RentalContract[];
}

@Component({
  selector: 'lync-clientes-list',
  imports: [FormsModule, DialogModule, PageHeaderComponent, PaginationComponent, EntityDialogComponent, AppButtonComponent, FormFieldComponent, RowMenuComponent, CurrencyBrlPipe, DateBrPipe],
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClientesListComponent {
  private readonly clientesService = inject(ClientesService);
  private readonly api             = inject(ApiService);

  readonly clientes   = this.clientesService.clientes;
  readonly loading    = this.clientesService.loading;
  readonly total      = this.clientesService.total;
  readonly totalPages = this.clientesService.totalPages;
  readonly search     = signal('');
  readonly page       = signal(1);
  readonly perPage    = 50;
  readonly saving     = signal(false);

  // Edit/create dialog
  readonly dialogVisible = signal(false);
  readonly editTarget    = signal<Customer | null>(null);

  // Detail / history dialog
  readonly detailData    = signal<CustomerHistory | null>(null);
  readonly detailLoading = signal(false);

  // Form fields
  readonly fTipo        = signal<'PF' | 'PJ'>('PF');
  readonly fNome        = signal('');
  readonly fCpfCnpj     = signal('');
  readonly fEmail       = signal('');
  readonly fTelefone    = signal('');
  readonly fCnh         = signal('');
  readonly fCnhValidade = signal('');
  readonly fRazaoSocial = signal('');
  readonly fResponsavel = signal('');

  readonly isEdit      = computed(() => !!this.editTarget());
  readonly dialogTitle = computed(() => this.isEdit() ? 'Editar Cliente' : 'Novo Cliente');

  readonly scheduleStatusClass: Record<string, string> = {
    AGENDADO: 'badge--warning', EM_ATENDIMENTO: 'badge--operador',
    CONCLUIDO: 'badge--success', CANCELADO: 'badge--inactive',
  };
  readonly contractStatusClass: Record<string, string> = {
    RESERVADO: 'badge--warning', ATIVO: 'badge--success',
    ENCERRADO: 'badge--inactive', CANCELADO: 'badge--danger',
  };

  constructor() { this.loadPage(); }

  private loadPage() {
    this.clientesService.load(this.search(), this.page(), this.perPage)
      .pipe(takeUntilDestroyed()).subscribe();
  }

  onSearch() {
    this.page.set(1);
    this.clientesService.load(this.search(), 1, this.perPage).pipe(takeUntilDestroyed()).subscribe();
  }

  goToPage(p: number) {
    this.page.set(p);
    this.clientesService.load(this.search(), p, this.perPage).pipe(takeUntilDestroyed()).subscribe();
  }

  openNew() {
    this.editTarget.set(null);
    this.fTipo.set('PF'); this.fNome.set(''); this.fCpfCnpj.set('');
    this.fEmail.set(''); this.fTelefone.set('');
    this.fCnh.set(''); this.fCnhValidade.set('');
    this.fRazaoSocial.set(''); this.fResponsavel.set('');
    this.dialogVisible.set(true);
  }

  openEdit(c: Customer) {
    this.editTarget.set(c);
    this.fTipo.set(c.tipo); this.fNome.set(c.nome); this.fCpfCnpj.set(c.cpfCnpj);
    this.fEmail.set(c.email ?? ''); this.fTelefone.set(c.telefone ?? '');
    this.fCnh.set(c.cnh ?? ''); this.fCnhValidade.set(c.cnhValidade?.slice(0, 10) ?? '');
    this.fRazaoSocial.set(c.razaoSocial ?? ''); this.fResponsavel.set(c.responsavel ?? '');
    this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  async openDetail(c: Customer) {
    this.detailData.set({ customer: c, schedules: [], contracts: [] });
    this.detailLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<CustomerHistory>(`/customers/${c.id}/history`));
      this.detailData.set(res);
    } catch {
      // keep shell with empty history on error
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail() { this.detailData.set(null); }

  getRowMenuItems(c: Customer): RowMenuItem[] {
    return [
      { label: 'Editar',        icon: 'pi pi-pencil',  command: () => this.openEdit(c) },
      { label: 'Ver Histórico', icon: 'pi pi-history', command: () => this.openDetail(c) },
    ];
  }

  async onDialogSave() {
    this.saving.set(true);
    const base = {
      tipo: this.fTipo(), nome: this.fNome(), cpfCnpj: this.fCpfCnpj(),
      email: this.fEmail() || undefined, telefone: this.fTelefone() || undefined,
    };
    const pf = this.fTipo() === 'PF'
      ? { cnh: this.fCnh() || undefined, cnhValidade: this.fCnhValidade() || undefined }
      : {};
    const pj = this.fTipo() === 'PJ'
      ? { razaoSocial: this.fRazaoSocial() || undefined, responsavel: this.fResponsavel() || undefined }
      : {};
    try {
      if (this.isEdit()) {
        await firstValueFrom(this.clientesService.update(this.editTarget()!.id, { ...base, ...pf, ...pj }));
      } else {
        await firstValueFrom(this.clientesService.create({ ...base, ...pf, ...pj } as any));
      }
      this.closeDialog();
    } finally { this.saving.set(false); }
  }
}
