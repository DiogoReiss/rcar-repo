import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { AuthService } from '@core/auth/services/auth.service';

@Component({
  selector: 'rcar-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'banner',
  },
})
export default class HeaderComponent {
  private readonly authService = inject(AuthService);

  readonly collapsed = input(false);
  readonly toggleSidebar = output<void>();

  readonly currentUser = this.authService.currentUser;

  onToggle(): void {
    this.toggleSidebar.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}

