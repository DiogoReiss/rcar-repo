import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Reusable branded button with variants, sizes, icon and loading state.
 *
 * Usage:
 *   <lync-btn label="Salvar" [loading]="saving()" (clicked)="onSave()" />
 *   <lync-btn label="Excluir" variant="danger" (clicked)="onDelete()" />
 *   <lync-btn label="Cancelar" variant="secondary" (clicked)="cancel()" />
 *   <lync-btn label="Ver mais" variant="ghost" size="sm" icon="pi pi-eye" (clicked)="open()" />
 */
@Component({
  selector: 'lync-btn',
  templateUrl: './app-button.html',
  styleUrl: './app-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
})
export default class AppButtonComponent {
  readonly label    = input.required<string>();
  readonly variant  = input<'primary' | 'secondary' | 'danger' | 'ghost'>('primary');
  readonly size     = input<'sm' | 'md'>('md');
  readonly icon     = input<string>('');
  readonly loading  = input(false);
  readonly disabled = input(false);
  readonly type     = input<'button' | 'submit'>('button');

  readonly clicked = output<void>();

  readonly cssClass = computed(() => {
    const v = this.variant();
    const s = this.size();
    return `lbtn lbtn--${v}${s === 'sm' ? ' lbtn--sm' : ''}`;
  });

  /** Spinner is light on filled buttons, dark on outlined/ghost buttons. */
  readonly spinnerClass = computed(() => {
    const v = this.variant();
    return v === 'secondary' || v === 'ghost'
      ? 'lbtn-spinner lbtn-spinner--dark'
      : 'lbtn-spinner';
  });
}
