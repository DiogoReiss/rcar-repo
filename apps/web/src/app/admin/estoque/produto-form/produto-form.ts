import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lync-produto-form',
  templateUrl: './produto-form.html',
  styleUrl: './produto-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProdutoFormComponent {}

