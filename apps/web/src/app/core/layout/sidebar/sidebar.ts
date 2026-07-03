import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '@core/auth/services/auth.service';
import { Feature } from '@core/auth/models/user.model';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  feature?: Feature;
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

  private readonly authService = inject(AuthService);
  private readonly currentUser = this.authService.currentUser;

  private readonly adminSections: MenuSection[] = [
    {
      title: 'Geral',
      items: [
        { label: 'Dashboard', icon: 'pi pi-home', route: '/admin' },
        {
          label: 'Clientes',
          icon: 'pi pi-users',
          route: '/admin/clientes',
          feature: 'ADMIN_CLIENTES',
        },
      ],
    },
    {
      title: 'Lavajato',
      items: [
        {
          label: 'Estoque',
          icon: 'pi pi-box',
          route: '/admin/estoque',
          feature: 'ADMIN_ESTOQUE',
        },
        {
          label: 'Serviços',
          icon: 'pi pi-wrench',
          route: '/admin/servicos',
          feature: 'ADMIN_SERVICOS',
        },
        {
          label: 'Agendamentos',
          icon: 'pi pi-calendar',
          route: '/lavajato/agendamento',
          feature: 'LAVAJATO',
        },
        {
          label: 'Fila',
          icon: 'pi pi-list-check',
          route: '/lavajato/fila',
          feature: 'LAVAJATO',
        },
      ],
    },
    {
      title: 'Aluguel',
      items: [
        {
          label: 'Frota',
          icon: 'pi pi-car',
          route: '/admin/frota',
          feature: 'ADMIN_FROTA',
        },
        {
          label: 'Aluguéis',
          icon: 'pi pi-file-edit',
          route: '/aluguel/contratos',
          feature: 'ALUGUEL',
        },
      ],
    },
    {
      title: 'Administração',
      items: [
        {
          label: 'Financeiro',
          icon: 'pi pi-chart-line',
          route: '/admin/financeiro',
          feature: 'ADMIN_FINANCEIRO',
        },
        {
          label: 'Templates',
          icon: 'pi pi-copy',
          route: '/admin/templates',
          feature: 'ADMIN_TEMPLATES',
        },
        {
          label: 'Usuários',
          icon: 'pi pi-user-edit',
          route: '/admin/usuarios',
          feature: 'ADMIN_USUARIOS',
        },
      ],
    },
  ];

  private readonly portalSections: MenuSection[] = [
    {
      title: 'Minha Conta',
      items: [
        {
          label: 'Agendamentos',
          icon: 'pi pi-calendar',
          route: '/portal/meus-agendamentos',
        },
        {
          label: 'Reservas',
          icon: 'pi pi-car',
          route: '/portal/minhas-reservas',
        },
        {
          label: 'Documentos',
          icon: 'pi pi-file',
          route: '/portal/meus-documentos',
        },
        {
          label: 'Pagamentos',
          icon: 'pi pi-wallet',
          route: '/portal/meus-pagamentos',
        },
        {
          label: 'Histórico',
          icon: 'pi pi-history',
          route: '/portal/historico',
        },
      ],
    },
  ];

  readonly menuSections = computed<MenuSection[]>(() => {
    const user = this.currentUser();
    if (user?.role === 'CLIENTE') return this.portalSections;

    const isGestorGeral = user?.role === 'GESTOR_GERAL';
    const userFeatures = user?.features ?? [];

    return this.adminSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.feature || isGestorGeral || userFeatures.includes(item.feature),
        ),
      }))
      .filter((section) => section.items.length > 0);
  });
}
