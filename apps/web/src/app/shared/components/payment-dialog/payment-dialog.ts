import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { PaymentMethod } from '@shared/models/entities.model';

/**
 * Reusable payment method selection dialog.
 *
 * Usage:
 *   <lync-payment-dialog
 *     [visible]="payingId() !== null"
 *     [loading]="payLoading()"
 *     (confirmed)="onPay($event)"
 *     (cancelled)="payingId.set(null)"
 *   />
 */
@Component({
  selector: 'lync-payment-dialog',
  imports: [FormsModule, DialogModule],
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaymentDialogComponent {
  readonly visible = input(false);
  readonly loading = input(false);
  readonly title   = input('Registrar Pagamento');

  readonly confirmed = output<PaymentMethod>();
  readonly cancelled = output<void>();

  selectedMethod: PaymentMethod = 'PIX';

  readonly methods: Array<{ value: PaymentMethod; label: string }> = [
    { value: 'PIX',            label: '⚡ PIX' },
    { value: 'DINHEIRO',       label: '💵 Dinheiro' },
    { value: 'CARTAO_CREDITO', label: '💳 Cartão de Crédito' },
    { value: 'CARTAO_DEBITO',  label: '💳 Cartão de Débito' },
  ];

  onConfirm() { this.confirmed.emit(this.selectedMethod); }
  onCancel()  { this.cancelled.emit(); }
}

