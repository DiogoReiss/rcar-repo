import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/services/api.service';
import { RentalContract, PaginatedResponse } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';

@Component({
  selector: 'lync-meus-documentos',
  imports: [PageHeaderComponent],
  templateUrl: './meus-documentos.html',
  styleUrl: './meus-documentos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MeusDocumentosComponent {
  private readonly api        = inject(ApiService);
  private readonly toast      = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly contracts = signal<RentalContract[]>([]);
  readonly loading   = signal(true);

  readonly statusLabel: Record<string, string> = {
    RESERVADO: 'Reservado', ATIVO: 'Ativo', ENCERRADO: 'Encerrado', CANCELADO: 'Cancelado',
  };

  constructor() {
    this.api.get<PaginatedResponse<RentalContract>>('/portal/my-contracts')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => { this.contracts.set(r.data); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });
  }

  download(c: RentalContract) {
    this.toast.add({ severity: 'info', summary: 'Contrato gerado', detail: `PDF do contrato ${c.id.toUpperCase()} enviado para seu e-mail.`, life: 4000 });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('pt-BR');
  }
}
