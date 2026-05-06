import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * A6/Q7: Accessible confirm dialog replacing native confirm().
 * Usage:
 *   <lync-confirm-dialog
 *     [open]="showConfirm()"
 *     [message]="'Deseja excluir este item?'"
 *     (confirmed)="onDelete()"
 *     (cancelled)="showConfirm.set(false)"
 *   />
 */
@Component({
  selector: 'lync-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-modal]': 'open() ? "true" : null',
    role: 'dialog',
  },
})
export default class ConfirmDialogComponent {
  readonly open = input(false);
  readonly message = input('Tem certeza?');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly danger = input(true);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}

