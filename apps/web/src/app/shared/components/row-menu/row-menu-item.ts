import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RowMenuItem } from './row-menu';

/**
 * Single item (or separator) inside a RowMenuPanel.
 * Renders a styled button for normal/danger items and a <hr> for separators.
 */
@Component({
  selector: 'lync-row-menu-item',
  template: `
    @if (item().separator) {
      <hr class="rmi-sep" aria-hidden="true" />
    } @else {
      <button
        type="button"
        class="rmi-btn"
        [class.rmi-btn--danger]="item().danger"
        [disabled]="item().disabled ?? false"
        (click)="handleClick()"
        role="menuitem"
      >
        @if (item().icon) {
          <i [class]="item().icon" class="rmi-icon" aria-hidden="true"></i>
        }
        <span class="rmi-label">{{ item().label }}</span>
      </button>
    }
  `,
  styles: [`
    :host { display: block; }

    .rmi-sep {
      margin: 4px 0;
      border: none;
      border-top: 1px solid #e2e8f0;
    }

    .rmi-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 14px;
      background: transparent;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: inherit;
      color: #374151;
      cursor: pointer;
      text-align: left;
      white-space: nowrap;
      transition: background 0.1s;
    }

    .rmi-btn:hover:not(:disabled) {
      background: #f1f5f9;
      color: #1e293b;
    }

    .rmi-btn:focus-visible {
      outline: 2px solid #ec8609;
      outline-offset: -2px;
      border-radius: 6px;
    }

    .rmi-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .rmi-btn--danger         { color: #dc2626; }
    .rmi-btn--danger:hover:not(:disabled) { background: #fef2f2; }

    .rmi-icon  { font-size: 0.8rem; flex-shrink: 0; opacity: 0.75; }
    .rmi-label { flex: 1; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RowMenuItemComponent {
  readonly item    = input.required<RowMenuItem>();
  readonly clicked = output<RowMenuItem>();

  handleClick(): void {
    const item = this.item();
    if (!item.disabled) this.clicked.emit(item);
  }
}


