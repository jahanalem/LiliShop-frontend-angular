import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'ls-theme';

// Keep in sync with --ls-bg in src/styles/_tokens.scss (used for the
// browser chrome color on mobile).
const THEME_COLORS: Record<Theme, string> = {
  light: '#f6f7fb',
  dark: '#0e1321',
};

/**
 * Owns the light/dark theme state. The active theme is exposed on
 * <html data-theme="…">, which drives the CSS `color-scheme` property;
 * both the Material system tokens and the --ls-* design tokens are
 * defined with light-dark() and follow it automatically.
 *
 * First visit: resolves from the OS `prefers-color-scheme`. An explicit
 * toggle is persisted (key "ls-theme") and re-applied before first paint
 * by the inline script in index.html.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);
  private storageService = inject(StorageService);

  readonly theme = signal<Theme>(this.resolveInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => this.applyTheme(this.theme()));
  }

  toggleTheme(): void {
    this.theme.update(current => (current === 'dark' ? 'light' : 'dark'));
    this.storageService.set<Theme>(THEME_STORAGE_KEY, this.theme());
  }

  private resolveInitialTheme(): Theme {
    const stored = this.storageService.get<Theme>(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    const prefersDark = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    this.document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach(meta => meta.setAttribute('content', THEME_COLORS[theme]));
  }
}
