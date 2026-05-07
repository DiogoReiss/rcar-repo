import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';

/**
 * Generic create / edit modal wrapper backed by PrimeNG p-dialog.
 *
 * Usage:
 *   <lync-entity-dialog
 *     title="Novo Produto"
 *     [visible]="dialogVisible()"
 *     [loading]="saving()"
 *     (submitted)="onSave()"
 *     (cancelled)="closeDialog()"
 *     (visibleChange)="dialogVisible.set($event)"
 *   >
 *     <!-- form content via ng-content -->
 *   </lync-entity-dialog>
 */
@Component({
  selector: 'lync-entity-dialog',
  imports: [DialogModule, AppButtonComponent],
  templateUrl: './entity-dialog.html',
  styleUrl: './entity-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EntityDialogComponent {
  readonly title   = input.required<string>();
  readonly visible = input(false);
  readonly loading = input(false);
  /** Set to true for wide forms (vehicles, customers) */
  readonly wide      = input(false);
  /** Override the save button label (default: 'Salvar') */
  readonly saveLabel = input('Salvar');

  readonly visibleChange = output<boolean>();
  readonly submitted     = output<void>();
  readonly cancelled     = output<void>();

  close() {
    this.visibleChange.emit(false);
    this.cancelled.emit();
  }
}

