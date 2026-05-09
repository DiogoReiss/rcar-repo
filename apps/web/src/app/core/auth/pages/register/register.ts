import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'lync-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly nome = signal('');
  readonly email = signal('');
  readonly senha = signal('');
  readonly confirmarSenha = signal('');

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit() {
    if (this.senha() !== this.confirmarSenha()) {
      this.error.set('As senhas não coincidem.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.register({
      nome: this.nome().trim(),
      email: this.email().trim(),
      senha: this.senha(),
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/auth/login'], {
          queryParams: { email: this.email().trim() },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Erro ao criar conta. Tente novamente.');
      },
    });
  }
}




