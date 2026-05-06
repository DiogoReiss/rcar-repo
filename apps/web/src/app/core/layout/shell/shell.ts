import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import SidebarComponent from '../sidebar/sidebar';
import HeaderComponent from '../header/header';

@Component({
  selector: 'lync-shell',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ShellComponent {
  readonly sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}

