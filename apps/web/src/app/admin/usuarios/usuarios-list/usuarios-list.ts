import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsersService } from '../users.service';
import { User } from '@shared/models/entities.model';

const ROLE_LABELS: Record<string, string> = {
  GESTOR_GERAL: 'Gestor',
  OPERADOR: 'Operador',
  CLIENTE: 'Cliente',
};

@Component({
  selector: 'lync-usuarios-list',
  imports: [RouterLink],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsuariosListComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  readonly users = this.usersService.users;
  readonly loading = this.usersService.loading;
  readonly error = this.usersService.error;
  readonly removing = signal<string | null>(null);

  readonly roleLabel = (role: string) => ROLE_LABELS[role] ?? role;

  ngOnInit() { this.usersService.load(); }

  async onRemove(user: User) {
    if (!confirm(`Desativar "${user.nome}"?`)) return;
    this.removing.set(user.id);
    try {
      await this.usersService.remove(user.id);
    } finally {
      this.removing.set(null);
    }
  }
}
