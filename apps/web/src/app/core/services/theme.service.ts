import { Injectable, computed, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'lync-theme';

@Injectable({ providedIn: 'root' })
export default class ThemeService {
  readonly theme = signal<ThemeMode>('light');
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    this.initializeTheme();
  }

  toggleTheme() {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode) {
    this.theme.set(mode);
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', mode);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }

  private initializeTheme() {
    const stored = this.readStoredTheme();
    if (stored) {
      this.setTheme(stored);
      return;
    }

    const prefersDark =
      typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.setTheme(prefersDark ? 'dark' : 'light');
  }

  private readStoredTheme(): ThemeMode | null {
    if (typeof localStorage === 'undefined') return null;
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'dark' || value === 'light') return value;
    return null;
  }
}

