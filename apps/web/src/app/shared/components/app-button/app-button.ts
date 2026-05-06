import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Dumb, reusable button. Encapsulates visual variants and loading state.
 *
 * Usage:
 *   <lync-btn label="Salvar" [loading]="saving()" (clicked)="onSave()" />
 *   <lync-btn label="Excluir" variant="danger" (clicked)="onDelete()" />
 *   <lync-btn label="Cancelar" variant="secondary" (clicked)="cancel()" />
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
  readonly variant  = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly icon     = input<string>('');
  readonly loading  = input(false);
  readonly disabled = input(false);
  readonly type     = input<'button' | 'submit'>('button');

  readonly clicked = output<void>();

  readonly cssClass = computed(() => {
    const map: Record<string, string> = {
      primary:   'btn-primary',
      secondary: 'btn-secondary',
      danger:    'btn-primary btn-danger-solid',
    };
    return map[this.variant()];
  });
}

