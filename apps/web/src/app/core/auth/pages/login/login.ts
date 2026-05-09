import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '@env/environment';

@Component({
  selector: 'lync-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);

  readonly email   = signal('');
  readonly senha   = signal('');
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);
  readonly isMock  = environment.mock;

  readonly quickUsers = [
    { label: 'Admin',    email: 'admin@rcar.dev',    senha: 'admin123',    icon: 'pi pi-shield' },
    { label: 'Operador', email: 'operador@rcar.dev', senha: 'op123',       icon: 'pi pi-wrench' },
    { label: 'Cliente',  email: 'cliente@rcar.dev',  senha: 'cliente123',  icon: 'pi pi-user' },
  ];

  quickLogin(u: { email: string; senha: string }) {
    this.email.set(u.email);
    this.senha.set(u.senha);
    this.onSubmit();
  }

  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.authService.login({ email: this.email(), senha: this.senha() }).subscribe({
      next: () => {
        this.loading.set(false);
        const next = this.route.snapshot.queryParamMap.get('next');
        if (next?.startsWith('/')) {
          this.router.navigateByUrl(next);
          return;
        }
        const role = this.authService.currentUser()?.role;
        this.router.navigate([role === 'CLIENTE' ? '/portal/minhas-reservas' : '/admin']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Erro ao fazer login. Tente novamente.');
      },
    });
  }
}
