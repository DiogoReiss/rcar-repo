import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsersService } from '../users.service';
import { User } from '@shared/models/entities.model';
import ConfirmDialogComponent from '@shared/components/confirm-dialog/confirm-dialog';

const ROLE_LABELS: Record<string, string> = {
  GESTOR_GERAL: 'Gestor',
  OPERADOR: 'Operador',
  CLIENTE: 'Cliente',
};

@Component({
  selector: 'lync-usuarios-list',
  imports: [RouterLink, ConfirmDialogComponent],
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
  readonly confirmTarget = signal<User | null>(null);

  readonly roleLabel = (role: string) => ROLE_LABELS[role] ?? role;

  ngOnInit() { this.usersService.load(); }

  onRemoveClick(user: User) {
    this.confirmTarget.set(user);
  }

  async onConfirmRemove() {
    const user = this.confirmTarget();
    if (!user) return;
    this.confirmTarget.set(null);
    this.removing.set(user.id);
    try {
      await this.usersService.remove(user.id);
    } finally {
      this.removing.set(null);
    }
  }

  onCancelRemove() {
    this.confirmTarget.set(null);
  }
}
