import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Generic pagination nav.
 *
 * Usage:
 *   <lync-pagination
 *     [page]="page()"
 *     [totalPages]="totalPages()"
 *     [total]="total()"
 *     (pageChange)="goToPage($event)"
 *   />
 */
@Component({
  selector: 'lync-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly total = input(0);
  readonly label = input('itens');

  readonly pageChange = output<number>();

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  prev(): void { if (this.page() > 1) this.pageChange.emit(this.page() - 1); }
  next(): void { if (this.page() < this.totalPages()) this.pageChange.emit(this.page() + 1); }
  go(p: number): void { this.pageChange.emit(p); }
}

