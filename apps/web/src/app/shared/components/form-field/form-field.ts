import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Thin wrapper that renders a consistent label, content slot, and optional error / hint text.
 *
 * Usage inside a `form-grid` container:
 *   <lync-form-field label="Nome" [required]="true">
 *     <input name="nome" [ngModel]="nome()" (ngModelChange)="nome.set($event)" />
 *   </lync-form-field>
 */
@Component({
  selector: 'lync-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.full]': 'full()' },
})
export default class FormFieldComponent {
  readonly label        = input.required<string>();
  readonly required     = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly hint         = input<string | null>(null);
  /** Span both columns when used inside a two-column form-grid */
  readonly full         = input(false);
}

