import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'rcar-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collapsed]': 'collapsed()',
    role: 'navigation',
    'aria-label': 'Menu principal',
  },
})
export default class SidebarComponent {
  readonly collapsed = input(false);

  readonly menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/admin' },
    { label: 'Usuários', icon: 'pi pi-users', route: '/admin/usuarios' },
    { label: 'Serviços', icon: 'pi pi-list', route: '/admin/servicos' },
    { label: 'Estoque', icon: 'pi pi-box', route: '/admin/estoque' },
    { label: 'Frota', icon: 'pi pi-car', route: '/admin/frota' },
    { label: 'Clientes', icon: 'pi pi-id-card', route: '/admin/clientes' },
    { label: 'Agendamentos', icon: 'pi pi-calendar', route: '/lavajato/agendamento' },
    { label: 'Fila', icon: 'pi pi-clock', route: '/lavajato/fila' },
    { label: 'Reservas', icon: 'pi pi-bookmark', route: '/aluguel/reserva' },
    { label: 'Contratos', icon: 'pi pi-file', route: '/aluguel/contratos' },
    { label: 'Templates', icon: 'pi pi-file-edit', route: '/admin/templates' },
  ];
}


