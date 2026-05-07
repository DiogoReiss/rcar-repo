import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import RowMenuPanelComponent from './row-menu-panel';

// ─── Public type ─────────────────────────────────────────────────────────────
/**
 * Describes a single row-menu entry.
 * Use `separator: true` (other fields ignored) to render a divider.
 * Use `danger: true` for destructive actions (renders in red).
 */
export interface RowMenuItem {
  label?:    string;
  icon?:     string;           // PrimeIcons class, e.g. 'pi pi-pencil'
  command?:  () => void;
  disabled?: boolean;
  separator?: boolean;
  danger?:   boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────
/**
 * Three-dot row-actions trigger. Opens a custom RowMenuPanel on click.
 *
 * Usage:
 *   <lync-row-menu [items]="getRowMenuItems(row)" />
 *
 * In the host component:
 *   getRowMenuItems(row: T): RowMenuItem[] {
 *     return [
 *       { label: 'Editar',  icon: 'pi pi-pencil',  command: () => this.openEdit(row) },
 *       { separator: true },
 *       { label: 'Excluir', icon: 'pi pi-trash',   command: () => this.onDelete(row), danger: true },
 *     ];
 *   }
 */
@Component({
  selector: 'lync-row-menu',
  imports: [RowMenuPanelComponent],
  template: `
    <button
      type="button"
      class="rmb"
      (click)="toggle($event)"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-expanded]="open()"
      aria-haspopup="menu"
    >
      <i class="pi pi-ellipsis-v" aria-hidden="true"></i>
    </button>

    @if (open()) {
      <lync-row-menu-panel
        [items]="items()"
        [top]="panelTop()"
        [right]="panelRight()"
        (dismissed)="close()"
      />
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .rmb {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; padding: 0;
      border: 1px solid transparent; border-radius: 6px;
      background: transparent; cursor: pointer; color: #64748b;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .rmb:hover:not(:disabled) {
      background: rgba(236, 134, 9, 0.08);
      border-color: rgba(236, 134, 9, 0.3);
      color: #ec8609;
    }
    .rmb:focus-visible { outline: 2px solid #ec8609; outline-offset: 2px; }
    .rmb:disabled      { opacity: 0.4; cursor: not-allowed; }
    .rmb i             { font-size: 0.9rem; pointer-events: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:inline-flex',
    // Close on any click outside this component's DOM subtree.
    // stopPropagation() in toggle() ensures the trigger click itself doesn't fire this.
    '(document:click)': 'onDocumentClick($event)',
  },
})
export default class RowMenuComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly items     = input<RowMenuItem[]>([]);
  readonly ariaLabel = input('Ações da linha');
  readonly disabled  = input(false);

  readonly open       = signal(false);
  readonly panelTop   = signal('0px');
  readonly panelRight = signal('0px');

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.open()) { this.close(); } else { this.openPanel(event.currentTarget as HTMLButtonElement); }
  }

  close(): void { this.open.set(false); }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private openPanel(trigger: HTMLButtonElement): void {
    const rect = trigger.getBoundingClientRect();
    const top  = rect.bottom + 6;
    const right = window.innerWidth - rect.right;
    // Flip above the trigger if the panel would go below the fold (assume max height 240px)
    const adjustedTop = top + 240 > window.innerHeight ? rect.top - 240 - 6 : top;
    this.panelTop.set(`${Math.max(4, adjustedTop)}px`);
    this.panelRight.set(`${Math.max(4, right)}px`);
    this.open.set(true);
  }
}
