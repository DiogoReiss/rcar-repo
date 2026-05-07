import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';

/**
 * Multi-step wizard dialog wrapper.
 *
 * The parent is responsible for:
 *   - tracking `currentStep` (signal<number>)
 *   - passing `canNext` based on per-step validation
 *   - responding to `(next)`, `(prev)`, `(submitted)`, `(cancelled)` outputs
 *
 * Usage:
 *   <lync-wizard-dialog
 *     title="Nova Reserva"
 *     [visible]="wizardVisible()"
 *     [steps]="['Período', 'Veículo', 'Detalhes']"
 *     [currentStep]="wizardStep()"
 *     [canNext]="canProceed()"
 *     [loading]="saving()"
 *     [wide]="true"
 *     (visibleChange)="wizardVisible.set($event)"
 *     (next)="wizardStep.set(wizardStep() + 1)"
 *     (prev)="wizardStep.set(wizardStep() - 1)"
 *     (submitted)="onSubmit()"
 *     (cancelled)="resetWizard()"
 *   >
 *     @if (wizardStep() === 0) { ... }
 *     @if (wizardStep() === 1) { ... }
 *     @if (wizardStep() === 2) { ... }
 *   </lync-wizard-dialog>
 */
@Component({
  selector: 'lync-wizard-dialog',
  imports: [DialogModule, AppButtonComponent],
  templateUrl: './wizard-dialog.html',
  styleUrl: './wizard-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WizardDialogComponent {
  readonly title       = input.required<string>();
  readonly visible     = input(false);
  readonly steps       = input.required<string[]>();
  readonly currentStep = input(0);
  readonly loading     = input(false);
  readonly canNext     = input(true);
  /** Widen dialog from 520px to 760px for complex steps */
  readonly wide        = input(false);

  readonly visibleChange = output<boolean>();
  readonly next          = output<void>();
  readonly prev          = output<void>();
  readonly submitted     = output<void>();
  readonly cancelled     = output<void>();

  readonly isFirst = computed(() => this.currentStep() === 0);
  readonly isLast  = computed(() => this.currentStep() === this.steps().length - 1);
  readonly dialogWidth = computed(() => this.wide() ? '760px' : '520px');

  close() {
    this.visibleChange.emit(false);
    this.cancelled.emit();
  }
}

