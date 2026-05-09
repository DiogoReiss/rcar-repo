import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import ThemeService from '@core/services/theme.service';

@Component({
  selector: 'lync-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent {
  private readonly themeService = inject(ThemeService);

  readonly isDarkTheme = this.themeService.isDark;

  readonly contactName = signal('');
  readonly contactPhone = signal('');
  readonly contactEmail = signal('');

  readonly washPlate = signal('');
  readonly washService = signal('LAVAGEM_COMPLETA');
  readonly washDate = signal('');
  readonly washTime = signal('');
  readonly washSubmitted = signal(false);

  readonly rentDateFrom = signal('');
  readonly rentDateTo = signal('');
  readonly rentCategory = signal('ECONOMICO');
  readonly rentStep = signal<1 | 2>(1);

  readonly canSubmitWash = computed(() =>
    !!this.contactName().trim()
    && !!this.contactPhone().trim()
    && !!this.washPlate().trim()
    && !!this.washDate()
    && !!this.washTime(),
  );

  readonly canContinueRent = computed(() =>
    !!this.contactName().trim()
    && !!this.contactPhone().trim()
    && !!this.rentDateFrom()
    && !!this.rentDateTo(),
  );

  submitWash() {
    if (!this.canSubmitWash()) return;
    this.washSubmitted.set(true);
  }

  continueRent() {
    if (!this.canContinueRent()) return;
    this.rentStep.set(2);
  }

  editRentSearch() {
    this.rentStep.set(1);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}

