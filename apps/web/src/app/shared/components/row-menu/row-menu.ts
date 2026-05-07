import { ChangeDetectionStrategy, Component, NgZone, computed, inject, input, viewChild } from '@angular/core';
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
    <p-menu #menu [model]="menuItems()" [popup]="true" appendTo="body" />
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
  private readonly zone = inject(NgZone);

  readonly items     = input<MenuItem[]>([]);
  readonly ariaLabel = input('Ações da linha');
  readonly disabled  = input(false);

  /**
   * Re-wraps every command in zone.run() so that OnPush components
   * get properly notified when a menu item triggers a state change.
   * PrimeNG registers its document-click listener outside Angular's zone
   * for performance, which means raw command callbacks run outside zone
   * and don't notify Angular's scheduler on the first invocation.
   */
  protected readonly menuItems = computed(() => this.wrapItems(this.items()));

  toggle(event: MouseEvent): void {
    event.stopPropagation(); // prevent table row click handlers from firing
    this.menu().toggle(event);
  }

  private wrapItems(items: MenuItem[]): MenuItem[] {
    return items.map(item => {
      const wrapped: MenuItem = { ...item };
      if (item.command) {
        const orig = item.command;
        wrapped.command = (ev) => this.zone.run(() => orig(ev));
      }
      if (item.items?.length) {
        wrapped.items = this.wrapItems(item.items);
      }
      return wrapped;
    });
  }
}

