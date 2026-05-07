import {
  ChangeDetectionStrategy, Component, computed, effect,
  input, model, output, signal,
} from '@angular/core';

@Component({
  selector: 'lync-mini-calendar',
  templateUrl: './mini-calendar.html',
  styleUrl: './mini-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MiniCalendarComponent {
  /** Currently selected/highlighted date (YYYY-MM-DD). Two-way bindable. */
  readonly selectedDate = model<string>(new Date().toISOString().slice(0, 10));
  /** Map of date → schedule count for dot indicators. */
  readonly monthData = input<Record<string, number>>({});
  /** Emitted when the viewed month changes (for parent to load month data). */
  readonly monthChanged = output<string>(); // YYYY-MM

  readonly today = new Date().toISOString().slice(0, 10);

  /** Internal signal tracking which month is displayed. */
  private readonly _viewDate = signal((() => {
    const d = new Date(this.selectedDate() + 'T12:00:00');
    return new Date(d.getFullYear(), d.getMonth(), 1);
  })());

  readonly viewYear  = computed(() => this._viewDate().getFullYear());
  readonly viewMonth = computed(() => this._viewDate().getMonth()); // 0-based

  readonly monthLabel = computed(() =>
    this._viewDate().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase())
  );

  /** 6-row × 7-col grid. null = padding cell. */
  readonly weeks = computed<(string | null)[][]>(() => {
    const y = this.viewYear();
    const m = this.viewMonth();
    const firstDow = new Date(y, m, 1).getDay(); // 0=Sun
    const offset   = firstDow === 0 ? 6 : firstDow - 1; // Monday-first
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const cells: (string | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  });

  constructor() {
    // When selectedDate changes externally, snap view to that month
    effect(() => {
      const sel = this.selectedDate();
      if (!sel) return;
      const d = new Date(sel + 'T12:00:00');
      if (d.getFullYear() !== this.viewYear() || d.getMonth() !== this.viewMonth()) {
        this._viewDate.set(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    });
  }

  prevMonth(): void {
    const d = new Date(this._viewDate());
    d.setMonth(d.getMonth() - 1);
    this._viewDate.set(d);
    this.monthChanged.emit(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  nextMonth(): void {
    const d = new Date(this._viewDate());
    d.setMonth(d.getMonth() + 1);
    this._viewDate.set(d);
    this.monthChanged.emit(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  selectDay(date: string | null): void {
    if (!date) return;
    this.selectedDate.set(date);
  }

  dayNum(date: string | null): number {
    return date ? +date.slice(-2) : 0;
  }

  count(date: string | null): number {
    return date ? (this.monthData()[date] ?? 0) : 0;
  }

  isSelected(date: string | null): boolean  { return date !== null && date === this.selectedDate(); }
  isToday(date: string | null): boolean     { return date !== null && date === this.today; }
}

