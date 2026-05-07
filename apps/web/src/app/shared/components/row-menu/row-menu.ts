import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';

/**
 * Three-dot row-actions context menu using PrimeNG Menu in popup mode.
 *
 * Usage:
 *   <lync-row-menu [items]="getRowMenuItems(row)" />
 *
 * In the host component build the MenuItem array:
 *   getRowMenuItems(row: T): MenuItem[] {
 *     return [
 *       { label: 'Editar',  icon: 'pi pi-pencil', command: () => this.openEdit(row) },
 *       { separator: true },
 *       { label: 'Excluir', icon: 'pi pi-trash',  styleClass: 'menu-item--danger',
 *         command: () => this.onDelete(row) },
 *     ];
 *   }
 *
 * Inputs:
 *   items      — MenuItem[] passed to p-menu
 *   ariaLabel  — accessible label for the trigger button (default: 'Ações da linha')
 *   disabled   — disables the trigger button entirely
 */
@Component({
  selector: 'lync-row-menu',
  imports: [Menu],
  template: `
    <p-menu #menu [model]="items()" [popup]="true" appendTo="body" />
    <button
      type="button"
      class="row-menu-btn"
      (click)="toggle($event)"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      aria-haspopup="menu"
    >
      <i class="pi pi-ellipsis-v" aria-hidden="true"></i>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .row-menu-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; padding: 0;
      border: 1px solid transparent; border-radius: 6px;
      background: transparent; cursor: pointer; color: #64748b;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .row-menu-btn:hover:not(:disabled) {
      background: rgba(236, 134, 9, 0.08);
      border-color: rgba(236, 134, 9, 0.3);
      color: #ec8609;
    }
    .row-menu-btn:focus-visible {
      outline: 2px solid #ec8609;
      outline-offset: 2px;
    }
    .row-menu-btn:disabled {
      opacity: 0.4; cursor: not-allowed;
    }
    .row-menu-btn i { font-size: 0.9rem; pointer-events: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex' },
})
export default class RowMenuComponent {
  private readonly menu = viewChild.required<Menu>('menu');

  readonly items     = input<MenuItem[]>([]);
  readonly ariaLabel = input('Ações da linha');
  readonly disabled  = input(false);

  toggle(event: MouseEvent): void {
    // Prevent table row click handlers from firing when the menu button is clicked
    event.stopPropagation();
    this.menu().toggle(event);
  }
}

