import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ServicosService } from '../servicos.service';
import { WashService } from '@shared/models/entities.model';
import PageHeaderComponent from '@shared/components/page-header/page-header';
import EntityDialogComponent from '@shared/components/entity-dialog/entity-dialog';
import ConfirmDialogComponent from '@shared/components/confirm-dialog/confirm-dialog';
import AppButtonComponent from '@shared/components/app-button/app-button';
import FormFieldComponent from '@shared/components/form-field/form-field';

@Component({
  selector: 'lync-servicos-list',
  imports: [FormsModule, PageHeaderComponent, EntityDialogComponent, ConfirmDialogComponent, AppButtonComponent, FormFieldComponent],
  templateUrl: './servicos-list.html',
  styleUrl: './servicos-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ServicosListComponent {
  private readonly servicosService = inject(ServicosService);
  private readonly toast = inject(MessageService);

  readonly servicos  = this.servicosService.servicos;
  readonly loading   = this.servicosService.loading;
  readonly saving    = signal(false);
  readonly toggling  = signal<string | null>(null);

  // Dialog
  readonly dialogVisible = signal(false);
  readonly editTarget    = signal<WashService | null>(null);
  readonly confirmTarget = signal<WashService | null>(null);

  // Form fields
  readonly fNome      = signal('');
  readonly fDescricao = signal('');
  readonly fPreco     = signal(0);
  readonly fDuracao   = signal(30);

  readonly isEdit      = computed(() => !!this.editTarget());
  readonly dialogTitle = computed(() => this.isEdit() ? 'Editar Serviço' : 'Novo Serviço');

  constructor() {
    // A16: takeUntilDestroyed in injection context — subscribe so the HTTP request fires
    this.servicosService.load(true).pipe(takeUntilDestroyed()).subscribe();
  }

  openNew() {
    this.editTarget.set(null);
    this.fNome.set(''); this.fDescricao.set('');
    this.fPreco.set(0); this.fDuracao.set(30);
    this.dialogVisible.set(true);
  }

  openEdit(s: WashService) {
    this.editTarget.set(s);
    this.fNome.set(s.nome); this.fDescricao.set(s.descricao ?? '');
    this.fPreco.set(s.preco); this.fDuracao.set(s.duracaoMin);
    this.dialogVisible.set(true);
  }

  closeDialog() { this.dialogVisible.set(false); }

  async onDialogSave() {
    this.saving.set(true);
    const data = {
      nome: this.fNome(), descricao: this.fDescricao() || undefined,
      preco: this.fPreco(), duracaoMin: this.fDuracao(),
    };
    try {
      if (this.isEdit()) {
        await firstValueFrom(this.servicosService.update(this.editTarget()!.id, data));
        this.toast.add({ severity: 'success', summary: 'Serviço atualizado', detail: 'Alterações salvas com sucesso.', life: 3000 });
      } else {
        await firstValueFrom(this.servicosService.create(data));
        this.toast.add({ severity: 'success', summary: 'Serviço criado', detail: 'Serviço cadastrado com sucesso.', life: 3000 });
      }
      this.closeDialog();
    } finally { this.saving.set(false); }
  }

  confirmToggle(s: WashService) { this.confirmTarget.set(s); }

  async onConfirmToggle() {
    const s = this.confirmTarget();
    if (!s) return;
    this.confirmTarget.set(null);
    this.toggling.set(s.id);
    try { await firstValueFrom(this.servicosService.update(s.id, { ativo: !s.ativo }));
      this.toast.add({ severity: 'success', summary: 'Status atualizado', life: 3000 });
    }
    finally { this.toggling.set(null); }
  }

  formatPrice(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }
}
