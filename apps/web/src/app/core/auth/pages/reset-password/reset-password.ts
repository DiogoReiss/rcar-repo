import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'rcar-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly novaSenha = signal('');
  readonly confirmarSenha = signal('');
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit(): void {
    if (this.novaSenha() !== this.confirmarSenha()) {
      this.error.set('As senhas não coincidem.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.authService.resetPassword(token, this.novaSenha()).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erro ao redefinir senha. O link pode estar expirado.');
      },
    });
  }
}
