import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lync-produtos-list',
  templateUrl: './produtos-list.html',
  styleUrl: './produtos-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProdutosListComponent {}

