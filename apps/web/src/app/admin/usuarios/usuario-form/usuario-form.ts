import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UsersService } from '../users.service';
import { Feature } from '@core/auth/models/user.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';

@Component({
  selector: 'lync-usuario-form',
  imports: [FormsModule, RouterLink, PageHeaderComponent],
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
  readonly features = signal<Feature[]>([]);

  readonly isGestorGeral = computed(() => this.role() === 'GESTOR_GERAL');

  readonly allFeatures: { value: Feature; label: string }[] = [
    { value: 'LAVAJATO', label: 'Lavajato' },
    { value: 'ALUGUEL', label: 'Aluguel' },
    { value: 'ADMIN_USUARIOS', label: 'Usuários' },
    { value: 'ADMIN_FROTA', label: 'Frota' },
    { value: 'ADMIN_ESTOQUE', label: 'Estoque' },
    { value: 'ADMIN_CLIENTES', label: 'Clientes' },
    { value: 'ADMIN_FINANCEIRO', label: 'Financeiro' },
    { value: 'ADMIN_TEMPLATES', label: 'Templates' },
    { value: 'ADMIN_SERVICOS', label: 'Serviços' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId.set(id);
      const user = this.usersService.users().find((u) => u.id === id);
      if (user) {
        this.nome.set(user.nome);
        this.email.set(user.email);
        this.role.set(user.role as 'GESTOR_GERAL' | 'OPERADOR');
        this.features.set((user.features ?? []) as Feature[]);
      }
    }
  }

  toggleFeature(feature: Feature) {
    const current = this.features();
    if (current.includes(feature)) {
      this.features.set(current.filter((f) => f !== feature));
    } else {
      this.features.set([...current, feature]);
    }
  }

  async onSubmit() {
    // Validate features for non-GESTOR_GERAL
    if (!this.isGestorGeral() && this.features().length === 0) {
      this.error.set('Selecione ao menos uma funcionalidade.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const featuresPayload = this.isGestorGeral() ? [] : this.features();
      if (this.isEdit()) {
        const data: Record<string, unknown> = {
          nome: this.nome(),
          email: this.email(),
          role: this.role(),
          features: featuresPayload,
        };
        if (this.senha()) data['senha'] = this.senha();
        await this.usersService.update(this.editId()!, data);
      } else {
        await this.usersService.create({
          nome: this.nome(),
          email: this.email(),
          senha: this.senha(),
          role: this.role(),
          features: featuresPayload,
          ativo: true,
        });
      }
      this.router.navigate(['/admin/usuarios']);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao salvar usuário.');
    } finally {
      this.loading.set(false);
    }
  }
}
