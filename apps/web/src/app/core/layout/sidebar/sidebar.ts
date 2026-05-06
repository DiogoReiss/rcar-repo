import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'lync-sidebar',
  imports: [RouterLink, RouterLinkActive, TooltipModule],
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

  readonly menuSections: MenuSection[] = [
    {
      title: 'Geral',
      items: [
        { label: 'Dashboard',    icon: 'pi pi-home',       route: '/admin' },
        { label: 'Clientes',     icon: 'pi pi-users',      route: '/admin/clientes' },
        { label: 'Frota',        icon: 'pi pi-car',        route: '/admin/frota' },
        { label: 'Estoque',      icon: 'pi pi-box',        route: '/admin/estoque' },
      ],
    },
    {
      title: 'Lavajato',
      items: [
        { label: 'Serviços',     icon: 'pi pi-wrench',     route: '/admin/servicos' },
        { label: 'Agendamentos', icon: 'pi pi-calendar',   route: '/lavajato/agendamento' },
        { label: 'Fila',         icon: 'pi pi-list-check', route: '/lavajato/fila' },
      ],
    },
    {
      title: 'Aluguel',
      items: [
        { label: 'Reservas',     icon: 'pi pi-ticket',     route: '/aluguel/reserva' },
        { label: 'Contratos',    icon: 'pi pi-file-edit',  route: '/aluguel/contratos' },
      ],
    },
    {
      title: 'Administração',
      items: [
        { label: 'Templates',    icon: 'pi pi-copy',       route: '/admin/templates' },
        { label: 'Usuários',     icon: 'pi pi-user-edit',  route: '/admin/usuarios' },
      ],
    },
  ];
}
