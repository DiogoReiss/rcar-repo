import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ServicosService } from '../servicos.service';

@Component({
  selector: 'lync-servico-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './servico-form.html',
  styleUrl: './servico-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ServicoFormComponent implements OnInit {
  private readonly servicosService = inject(ServicosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEdit = signal(false);
  readonly editId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly nome = signal('');
  readonly descricao = signal('');
  readonly preco = signal(0);
  readonly duracaoMin = signal(30);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId.set(id);
      const s = this.servicosService.servicos().find(x => x.id === id);
      if (s) {
        this.nome.set(s.nome);
        this.descricao.set(s.descricao ?? '');
        this.preco.set(s.preco);
        this.duracaoMin.set(s.duracaoMin);
      }
    }
  }

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    const data = { nome: this.nome(), descricao: this.descricao() || undefined, preco: this.preco(), duracaoMin: this.duracaoMin() };
    try {
      this.isEdit() ? await this.servicosService.update(this.editId()!, data) : await this.servicosService.create(data);
      this.router.navigate(['/admin/servicos']);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao salvar serviço.');
    } finally {
      this.loading.set(false);
    }
  }
}

