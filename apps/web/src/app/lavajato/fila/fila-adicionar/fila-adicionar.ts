import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { FilaService } from '../fila.service';
import { Customer, PaginatedResponse } from '@shared/models/entities.model';
import { ApiService } from '@core/services/api.service';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import FormFieldComponent from '@shared/components/form-field/form-field';
import AppButtonComponent from '@shared/components/app-button/app-button';
import CurrencyBrlPipe from '@shared/pipes/currency-brl.pipe';

@Component({
  selector: 'lync-fila-adicionar',
  imports: [FormsModule, RouterLink, PageHeaderComponent, FormFieldComponent, AppButtonComponent, CurrencyBrlPipe],
  templateUrl: './fila-adicionar.html',
  styleUrl: './fila-adicionar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FilaAdicionarComponent {
  private readonly filaService = inject(FilaService);
  private readonly api         = inject(ApiService);
  private readonly router      = inject(Router);
  private readonly toast       = inject(MessageService);

  readonly services   = this.filaService.services;
  readonly customers  = signal<Customer[]>([]);

  // Form mode: 'avulso' (walk-in) or 'cadastrado' (registered customer)
  readonly mode       = signal<'avulso' | 'cadastrado'>('avulso');
  readonly saving     = signal(false);

  // Avulso fields
  readonly fNome      = signal('');
  readonly fPlaca     = signal('');
  // Cadastrado fields
  readonly fClienteId = signal('');
  // Common
  readonly fServiceId = signal('');

  constructor() {
    this.filaService.loadServices().pipe(takeUntilDestroyed()).subscribe({
      next: (res) => { if (res.data.length) this.fServiceId.set(res.data[0].id); },
    });
    this.api.get<PaginatedResponse<Customer>>('/customers').pipe(takeUntilDestroyed()).subscribe({
      next: (res) => this.customers.set(res.data ?? []),
    });
  }

  async onSubmit() {
    if (!this.fServiceId()) return;
    this.saving.set(true);
    try {
      await firstValueFrom(this.filaService.addToQueue({
        nomeAvulso: this.mode() === 'avulso' ? this.fNome() : undefined,
        customerId: this.mode() === 'cadastrado' ? this.fClienteId() : undefined,
        serviceId:  this.fServiceId(),
        veiculoPlaca: this.fPlaca() || undefined,
      }));
      this.toast.add({ severity: 'success', summary: 'Adicionado à fila', detail: 'Cliente entrou na fila com sucesso.', life: 3000 });
      await firstValueFrom(this.filaService.loadQueue());
      this.router.navigate(['/lavajato/fila']);
    } finally {
      this.saving.set(false);
    }
  }
}

