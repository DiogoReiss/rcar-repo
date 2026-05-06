import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClientesService } from '../clientes.service';

@Component({
  selector: 'lync-cliente-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClienteFormComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEdit = signal(false);
  readonly editId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly tipo = signal<'PF' | 'PJ'>('PF');
  readonly nome = signal('');
  readonly cpfCnpj = signal('');
  readonly email = signal('');
  readonly telefone = signal('');
  readonly cnh = signal('');
  readonly cnhValidade = signal('');
  readonly razaoSocial = signal('');
  readonly responsavel = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true); this.editId.set(id);
      const c = this.clientesService.clientes().find(x => x.id === id);
      if (c) {
        this.tipo.set(c.tipo); this.nome.set(c.nome); this.cpfCnpj.set(c.cpfCnpj);
        this.email.set(c.email ?? ''); this.telefone.set(c.telefone ?? '');
        this.cnh.set(c.cnh ?? ''); this.cnhValidade.set(c.cnhValidade?.slice(0, 10) ?? '');
        this.razaoSocial.set(c.razaoSocial ?? ''); this.responsavel.set(c.responsavel ?? '');
      }
    }
  }

  async onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    const base = { tipo: this.tipo(), nome: this.nome(), cpfCnpj: this.cpfCnpj(), email: this.email() || undefined, telefone: this.telefone() || undefined };
    const pf = this.tipo() === 'PF' ? { cnh: this.cnh() || undefined, cnhValidade: this.cnhValidade() || undefined } : {};
    const pj = this.tipo() === 'PJ' ? { razaoSocial: this.razaoSocial() || undefined, responsavel: this.responsavel() || undefined } : {};
    try {
      this.isEdit() ? await this.clientesService.update(this.editId()!, { ...base, ...pf, ...pj })
        : await this.clientesService.create({ ...base, ...pf, ...pj });
      this.router.navigate(['/admin/clientes']);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Erro ao salvar cliente.');
    } finally {
      this.loading.set(false);
    }
  }
}

