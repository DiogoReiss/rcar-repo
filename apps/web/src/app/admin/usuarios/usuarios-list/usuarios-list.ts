import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import type { RowMenuItem } from '@shared/components/row-menu/row-menu';
import { UsersService } from '../users.service';
import { User } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import ConfirmDialogComponent from '@shared/components/confirm-dialog/confirm-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';
import RowMenuComponent from '@shared/components/row-menu/row-menu';

const ROLE_LABELS: Record<string, string> = {
  GESTOR_GERAL: 'Gestor',
  OPERADOR: 'Operador',
  CLIENTE: 'Cliente',
};

@Component({
  selector: 'lync-usuarios-list',
  imports: [FormsModule, PageHeaderComponent, EntityDialogComponent, ConfirmDialogComponent, AppButtonComponent, FormFieldComponent, RowMenuComponent],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsuariosListComponent {
  private readonly usersService = inject(UsersService);
  private readonly toast = inject(MessageService);

  readonly users = this.usersService.users;
  readonly loading = this.usersService.loading;
  readonly saving = signal(false);
  readonly removing = signal<string | null>(null);

  // Dialogs
  readonly dialogVisible = signal(false);
  readonly editTarget = signal<User | null>(null);
  readonly confirmTarget = signal<User | null>(null);

  // Form fields
  readonly fNome = signal('');
  readonly fEmail = signal('');
  readonly fSenha = signal('');
  readonly fRole = signal<'GESTOR_GERAL' | 'OPERADOR'>('OPERADOR');

  readonly isEdit = computed(() => !!this.editTarget());
  readonly dialogTitle = computed(() => this.isEdit() ? 'Editar Usuário' : 'Novo Usuário');
  readonly roleLabel = (role: string) => ROLE_LABELS[role] ?? role;

  constructor() {
    this.usersService.load().pipe(takeUntilDestroyed()).subscribe();
  }

  openNew() {
    this.editTarget.set(null);
    this.fNome.set(''); this.fEmail.set('');
    this.fSenha.set(''); this.fRole.set('OPERADOR');
    this.dialogVisible.set(true);
  }

  openEdit(u: User) {
    this.editTarget.set(u);
    this.fNome.set(u.nome); this.fEmail.set(u.email);
    this.fSenha.set(''); this.fRole.set(u.role as 'GESTOR_GERAL' | 'OPERADOR');
    this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  async onDialogSave() {
    this.saving.set(true);
    try {
      if (this.isEdit()) {
        const data: Record<string, unknown> = { nome: this.fNome(), email: this.fEmail(), role: this.fRole() };
        if (this.fSenha()) data['senha'] = this.fSenha();
        await firstValueFrom(this.usersService.update(this.editTarget()!.id, data as any));
        this.toast.add({ severity: 'success', summary: 'Usuário atualizado', detail: 'Alterações salvas.', life: 3000 });
      } else {
        await firstValueFrom(this.usersService.create({
          nome: this.fNome(), email: this.fEmail(),
          senha: this.fSenha(), role: this.fRole(), ativo: true,
        }));
        this.toast.add({ severity: 'success', summary: 'Usuário criado', detail: 'Usuário cadastrado com sucesso.', life: 3000 });
      }
      this.closeDialog();
    } finally { this.saving.set(false); }
  }

  onRemoveClick(user: User) { this.confirmTarget.set(user); }

  onConfirmRemove() {
    const user = this.confirmTarget();
    if (!user) return;
    this.confirmTarget.set(null);
    this.removing.set(user.id);
    this.usersService.remove(user.id).pipe(takeUntilDestroyed()).subscribe({
      complete: () => this.removing.set(null),
      error: () => this.removing.set(null),
    });
  }

  onCancelRemove() { this.confirmTarget.set(null); }

  getRowMenuItems(u: User): RowMenuItem[] {
    return [
      { label: 'Editar',    icon: 'pi pi-pencil', command: () => this.openEdit(u) },
      { separator: true },
      { label: 'Desativar', icon: 'pi pi-ban', danger: true, command: () => this.onRemoveClick(u) },
    ];
  }
}
