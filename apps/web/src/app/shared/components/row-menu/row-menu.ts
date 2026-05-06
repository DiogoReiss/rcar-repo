import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

/**
 * Three-dot row-actions context menu using PrimeNG Menu in popup mode.
 *
 * Usage:
 *   <lync-row-menu [items]="getRowMenuItems(row)" />
 *
 * In the host component build the MenuItem array in a method:
 *   getRowMenuItems(row: T): MenuItem[] {
 *     return [
 *       { label: 'Editar', icon: 'pi pi-pencil', command: () => this.openEdit(row) },
 *       { separator: true },
 *       { label: 'Excluir', icon: 'pi pi-trash', styleClass: 'menu-item--danger', command: () => this.onDelete(row) },
 *     ];
 *   }
 */
@Component({
  selector: 'lync-row-menu',
  imports: [MenuModule],
  template: `
    <p-menu #menu [model]="items()" [popup]="true" appendTo="body" />
    <button
      type="button"
      class="row-menu-btn"
      (click)="menu.toggle($event)"
      [attr.aria-label]="ariaLabel()"
      aria-haspopup="true"
    >
      <i class="pi pi-ellipsis-v" aria-hidden="true"></i>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .row-menu-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      border: 1px solid transparent; border-radius: 6px;
      background: transparent; cursor: pointer; color: #64748b;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .row-menu-btn:hover {
      background: rgba(236, 134, 9, 0.08);
      border-color: rgba(236, 134, 9, 0.3);
      color: #ec8609;
    }
    .row-menu-btn:focus-visible {
      outline: 2px solid #ec8609;
      outline-offset: 2px;
    }
    .row-menu-btn i { font-size: 0.9rem; pointer-events: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex' },
})
export default class RowMenuComponent {
  readonly items     = input<MenuItem[]>([]);
  readonly ariaLabel = input('Ações da linha');
}

