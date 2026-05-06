import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UsersService } from '../users.service';

@Component({
  selector: 'lync-usuario-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsuarioFormComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEdit = signal(false);
  readonly editId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly nome = signal('');
  readonly email = signal('');
  readonly senha = signal('');
  readonly role = signal<'GESTOR_GERAL' | 'OPERADOR'>('OPERADOR');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId.set(id);
      const user = this.usersService.users().find(u => u.id === id);
      if (user) {
        this.nome.set(user.nome);
        this.email.set(user.email);
        this.role.set(user.role as 'GESTOR_GERAL' | 'OPERADOR');
      }
    }
  }

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.isEdit()) {
        const data: Record<string, unknown> = { nome: this.nome(), email: this.email(), role: this.role() };
        if (this.senha()) data['senha'] = this.senha();
        await this.usersService.update(this.editId()!, data);
      } else {
        await this.usersService.create({ nome: this.nome(), email: this.email(), senha: this.senha(), role: this.role(), ativo: true });
      }
      this.router.navigate(['/admin/usuarios']);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao salvar usuário.');
    } finally {
      this.loading.set(false);
    }
  }
}

