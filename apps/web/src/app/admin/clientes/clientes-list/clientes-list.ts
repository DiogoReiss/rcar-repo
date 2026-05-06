import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientesService } from '../clientes.service';

@Component({
  selector: 'lync-clientes-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClientesListComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);

  readonly clientes = this.clientesService.clientes;
  readonly loading = this.clientesService.loading;
  readonly error = this.clientesService.error;
  readonly search = signal('');

  ngOnInit() { this.clientesService.load(); }

  onSearch() { this.clientesService.load(this.search()); }
}
