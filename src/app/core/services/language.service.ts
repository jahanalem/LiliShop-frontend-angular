import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ILanguage } from 'src/app/shared/models/language';
import { StorageService } from './storage.service';
import { REGISTERED_LOCALES } from '../i18n/locale-registry';

const LANGUAGE_STORAGE_KEY = 'ls-lang';
const DEFAULT_LANGUAGE_CODE = 'en';

/** Mirrors ASP.NET Core's CookieRequestCultureProvider so the backend resolves the same culture. */
const CULTURE_COOKIE_NAME = '.AspNetCore.Culture';

/** Known RTL scripts, used before the language list has loaded from the API. */
const RTL_LANGUAGE_CODES: ReadonlySet<string> = new Set(['fa', 'ar', 'he', 'ur']);

interface StoredLanguage {
  code: string;
  dir: 'ltr' | 'rtl';
}

/**
 * Owns the current-language state. The active code is exposed on
 * <html lang="…" dir="…"> (re-applied before first paint by the inline script
 * in index.html) and sent to the API on every request via the
 * Accept-Language header (language.interceptor) plus the ASP.NET culture cookie.
 *
 * The available languages come from GET /api/languages — adding a language in
 * the database makes it appear here without any frontend change.
 *
 * Switching performs a full page reload: LOCALE_ID (currency/date/number
 * formatting) is fixed at bootstrap time, and a reload is the only way to
 * re-evaluate every locale-sensitive pipe consistently.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private http = inject(HttpClient);
  private document = inject(DOCUMENT);
  private storageService = inject(StorageService);

  readonly languages = signal<ILanguage[]>([]);
  readonly currentCode = signal<string>(this.resolveInitialCode());

  readonly currentDirection = computed<'ltr' | 'rtl'>(() => {
    const language = this.languages().find(l => l.code === this.currentCode());
    if (language) {
      return language.direction;
    }
    return RTL_LANGUAGE_CODES.has(this.currentCode()) ? 'rtl' : 'ltr';
  });

  readonly isRtl = computed(() => this.currentDirection() === 'rtl');

  /** Locale used for LOCALE_ID: falls back to English formatting for locales without bundled CLDR data. */
  readonly localeId = computed(() =>
    REGISTERED_LOCALES.has(this.currentCode()) ? this.currentCode() : DEFAULT_LANGUAGE_CODE);

  constructor() {
    effect(() => this.applyToDocument(this.currentCode(), this.currentDirection()));
  }

  /**
   * Loads the active languages from the API. Called once at startup
   * (app.config.ts, provideAppInitializer) — not from the constructor, so the
   * language interceptor can safely inject this service.
   */
  initialize(): void {
    this.http.get<ILanguage[]>(`${environment.apiUrl}languages`).subscribe({
      next: languages => {
        this.languages.set(languages ?? []);
        this.ensureCurrentIsActive();
      },
      error: () => {
        // Language metadata is non-critical: keep the current (persisted or default)
        // language so the shop stays usable when the API call fails.
      }
    });
  }

  setLanguage(code: string): void {
    if (code === this.currentCode()) {
      return;
    }

    const direction = this.directionFor(code);
    this.storageService.set<StoredLanguage>(LANGUAGE_STORAGE_KEY, { code, dir: direction });
    this.writeCultureCookie(code);

    // Full reload so LOCALE_ID and all locale-sensitive pipes pick up the new locale.
    this.document.location.reload();
  }

  private resolveInitialCode(): string {
    const stored = this.storageService.get<StoredLanguage>(LANGUAGE_STORAGE_KEY);
    if (stored?.code) {
      return stored.code;
    }

    const browserLanguage = this.document.defaultView?.navigator?.language;
    if (browserLanguage) {
      return browserLanguage.split('-')[0].toLowerCase();
    }

    return DEFAULT_LANGUAGE_CODE;
  }

  /** The persisted choice may have been deactivated in the database; fall back to the default language. */
  private ensureCurrentIsActive(): void {
    const languages = this.languages();
    if (languages.length === 0 || languages.some(l => l.code === this.currentCode())) {
      return;
    }

    const fallback = languages.find(l => l.isDefault) ?? languages[0];
    this.currentCode.set(fallback.code);
    this.storageService.set<StoredLanguage>(LANGUAGE_STORAGE_KEY, { code: fallback.code, dir: fallback.direction });
    this.writeCultureCookie(fallback.code);
  }

  private directionFor(code: string): 'ltr' | 'rtl' {
    const language = this.languages().find(l => l.code === code);
    if (language) {
      return language.direction;
    }
    return RTL_LANGUAGE_CODES.has(code) ? 'rtl' : 'ltr';
  }

  private applyToDocument(code: string, direction: 'ltr' | 'rtl'): void {
    this.document.documentElement.setAttribute('lang', code);
    this.document.documentElement.setAttribute('dir', direction);
  }

  private writeCultureCookie(code: string): void {
    const value = encodeURIComponent(`c=${code}|uic=${code}`);
    const oneYearInSeconds = 60 * 60 * 24 * 365;
    this.document.cookie = `${CULTURE_COOKIE_NAME}=${value}; path=/; max-age=${oneYearInSeconds}; samesite=lax`;
  }
}
