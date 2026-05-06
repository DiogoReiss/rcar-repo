import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

/**
 * Accessible confirm / destructive-action dialog backed by PrimeNG p-dialog.
 *
 * Usage:
 *   <lync-confirm-dialog
 *     [open]="showConfirm()"
 *     message="Deseja excluir este item?"
 *     (confirmed)="onDelete()"
 *     (cancelled)="showConfirm.set(false)"
 *   />
 */
@Component({
  selector: 'lync-confirm-dialog',
  imports: [DialogModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ConfirmDialogComponent {
  readonly open         = input(false);
  readonly message      = input('Tem certeza?');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel  = input('Cancelar');
  readonly danger       = input(true);
  readonly loading      = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
