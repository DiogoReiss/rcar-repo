import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RowMenuItem } from './row-menu';
import RowMenuItemComponent from './row-menu-item';

/**
 * Floating dropdown panel rendered with `position: fixed` so it escapes
 * any overflow-hidden ancestor (table cells, etc.).
 *
 * Created/destroyed by RowMenuComponent via @if; positioning coords are
 * calculated by the parent at open-time and passed as inputs.
 */
@Component({
  selector: 'lync-row-menu-panel',
  imports: [RowMenuItemComponent],
  template: `
    <div
      class="rmp-panel"
      role="menu"
      [style.top]="top()"
      [style.right]="right()"
      tabindex="-1"
    >
      @for (item of items(); track $index) {
        <lync-row-menu-item [item]="item" (clicked)="onItemClicked($event)" />
      }
    </div>
  `,
  styles: [`
    /* :host must be display:contents so the fixed panel escapes the host element's box */
    :host { display: contents; }

    .rmp-panel {
      position: fixed;
      min-width: 168px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow:
        0 4px 6px -1px rgba(0,0,0,0.1),
        0 10px 24px -4px rgba(0,0,0,0.08);
      padding: 4px;
      z-index: 9999;
      animation: rmp-enter 0.12s ease;
    }

    @keyframes rmp-enter {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Close on Escape — listens at document level so focus doesn't need to be inside the panel
    '(document:keydown.escape)': 'dismissed.emit()',
  },
})
export default class RowMenuPanelComponent {
  readonly items = input<RowMenuItem[]>([]);
  /** Distance from the top of the viewport (px string, e.g. "120px") */
  readonly top   = input('0px');
  /** Distance from the right of the viewport (px string, e.g. "24px") */
  readonly right = input('0px');

  /** Emitted when the panel should be closed (item clicked or Escape pressed). */
  readonly dismissed = output<void>();

  onItemClicked(item: RowMenuItem): void {
    item.command?.();
    this.dismissed.emit();
  }
}


