import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shared page header with a title and an optional actions slot.
 *
 * Usage:
 *   <lync-page-header title="Usuários">
 *     <a class="btn-primary" routerLink="novo">+ Novo</a>
 *   </lync-page-header>
 */
@Component({
  selector: 'lync-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PageHeaderComponent {
  readonly title = input.required<string>();
}

