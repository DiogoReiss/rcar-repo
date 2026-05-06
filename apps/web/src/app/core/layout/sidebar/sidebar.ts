import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '@core/auth/services/auth.service';

interface MenuItem  { label: string; icon: string; route: string; }
interface MenuSection { title: string; items: MenuItem[]; }

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

  private readonly authService = inject(AuthService);
  private readonly currentUser = this.authService.currentUser;

  private readonly adminSections: MenuSection[] = [
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

  private readonly portalSections: MenuSection[] = [
    {
      title: 'Minha Conta',
      items: [
        { label: 'Agendamentos', icon: 'pi pi-calendar',   route: '/portal/meus-agendamentos' },
        { label: 'Reservas',     icon: 'pi pi-car',        route: '/portal/minhas-reservas' },
        { label: 'Documentos',   icon: 'pi pi-file',       route: '/portal/meus-documentos' },
        { label: 'Histórico',    icon: 'pi pi-history',    route: '/portal/historico' },
      ],
    },
  ];

  readonly menuSections = computed<MenuSection[]>(() =>
    this.currentUser()?.role === 'CLIENTE' ? this.portalSections : this.adminSections
  );
}
