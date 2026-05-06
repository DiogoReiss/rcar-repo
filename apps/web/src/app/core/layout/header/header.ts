import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';

const ROLE_LABELS: Record<string, string> = {
  GESTOR_GERAL: 'Gestor Geral',
  OPERADOR: 'Operador',
  CLIENTE: 'Cliente',
};

@Component({
  selector: 'lync-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'banner' },
})
export default class HeaderComponent {
  private readonly authService = inject(AuthService);

  readonly collapsed = input(false);
  readonly toggleSidebar = output<void>();
  readonly currentUser = this.authService.currentUser;

  onToggle(): void { this.toggleSidebar.emit(); }
  logout(): void { this.authService.logout(); }
  roleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }

  userInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
}
