import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ILanguage } from 'src/app/shared/models/language';
import { StorageService } from './storage.service';
import { REGISTERED_LOCALES } from '../i18n/locale-registry';
import { countryFromTimezone } from '../i18n/timezone-country-map';

const LANGUAGE_STORAGE_KEY = 'ls-lang';
const DEFAULT_LANGUAGE_CODE = 'en';

/** Mirrors ASP.NET Core's CookieRequestCultureProvider so the backend resolves the same culture. */
const CULTURE_COOKIE_NAME = '.AspNetCore.Culture';

/** Known RTL scripts, used before the language list has loaded from the API. */
const RTL_LANGUAGE_CODES: ReadonlySet<string> = new Set(['fa', 'ar', 'he', 'ur']);

interface StoredLanguage {
  code: string;
  dir: 'ltr' | 'rtl';
  /**
   * How this value was chosen: 'user' = explicit choice (never auto-overridden, per GDPR-style
   * user control), 'detected' = automatic first-visit detection (may be re-evaluated).
   * Absent on entries written before this field existed — treated as 'user' to be safe.
   */
  source?: 'user' | 'detected';
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
        this.runFirstVisitDetection();
      },
      error: () => {
        // Language metadata is non-critical: keep the current (persisted or default)
        // language so the shop stays usable when the API call fails.
      }
    });
  }

  /**
   * First-visit language detection. Priority chain:
   *   1. Explicit user choice (localStorage, source 'user') — absolute, never overridden here.
   *   2. Device timezone → country → Language.CountryCodes mapping (data-driven; solves the
   *      "browser is English but the user is in Iran/Turkey/China" case without any IP lookup).
   *   3. Browser language (already applied by resolveInitialCode at bootstrap).
   *   4. Backend default language (applied by ensureCurrentIsActive when nothing else matches).
   * Privacy: only the timezone string every site can read is used; nothing leaves the device
   * and no location data is stored — just the resulting language choice, tagged 'detected'.
   */
  private runFirstVisitDetection(): void {
    const stored = this.storageService.get<StoredLanguage>(LANGUAGE_STORAGE_KEY);
    if (stored?.code && stored.source !== 'detected') {
      return; // explicit (or legacy) choice — priority 1 wins.
    }

    const detected = this.detectLanguageFromTimezone();
    if (!detected || detected.code === this.currentCode()) {
      if (detected) {
        // Same language as currently shown — just remember how we got here.
        this.persist(detected.code, detected.direction, 'detected');
      }
      return;
    }

    this.persist(detected.code, detected.direction, 'detected');
    this.writeCultureCookie(detected.code);
    // One-time reload on first visit so LOCALE_ID, translations and direction all rebind.
    this.reloadApp();
  }

  private detectLanguageFromTimezone(): ILanguage | null {
    const timezone = this.getTimezone();
    const country = countryFromTimezone(timezone);
    if (!country) {
      return null;
    }

    // Languages arrive ordered by DisplayOrder: when two languages claim one country,
    // the earlier one wins deterministically.
    return this.languages().find(l => l.countries?.includes(country)) ?? null;
  }

  /** Separated for testability (specs can override the device timezone). */
  getTimezone(): string | undefined {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  }

  /**
   * Applies the signed-in user's stored language on a fresh device (profile preference is an
   * explicit choice, priority 1). A local explicit choice on THIS device stays authoritative.
   */
  applyProfileLanguage(code: string | null | undefined): void {
    if (!code) {
      return;
    }

    const stored = this.storageService.get<StoredLanguage>(LANGUAGE_STORAGE_KEY);
    if (stored?.code && stored.source !== 'detected') {
      return; // this device already has an explicit choice.
    }

    const normalized = code.toLowerCase();
    if (normalized === this.currentCode()) {
      this.persist(normalized, this.currentDirection(), 'user');
      return;
    }

    if (!this.languages().some(l => l.code === normalized)) {
      return; // stored preference points at a deactivated language.
    }

    this.persist(normalized, this.directionFor(normalized), 'user');
    this.writeCultureCookie(normalized);
    this.reloadApp();
  }

  setLanguage(code: string): void {
    if (code === this.currentCode()) {
      return;
    }

    const direction = this.directionFor(code);
    this.persist(code, direction, 'user');
    this.writeCultureCookie(code);

    // Store the explicit choice in the profile too, so a login on a fresh device restores it
    // (401 for anonymous users is expected and ignored). The reload waits for this request to
    // settle — reloading immediately would cancel it — but never longer than 800 ms.
    let reloaded = false;
    const reloadOnce = () => {
      if (!reloaded) {
        reloaded = true;
        // Full reload so LOCALE_ID and all locale-sensitive pipes pick up the new locale.
        this.reloadApp();
      }
    };

    this.http.put(`${environment.apiUrl}account/preferred-language`, { languageCode: code })
      .subscribe({ next: reloadOnce, error: reloadOnce });
    setTimeout(reloadOnce, 800);
  }

  private persist(code: string, dir: 'ltr' | 'rtl', source: 'user' | 'detected'): void {
    this.storageService.set<StoredLanguage>(LANGUAGE_STORAGE_KEY, { code, dir, source });
  }

  /** Seam for tests; jsdom cannot navigate. */
  protected reloadApp(): void {
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

  /**
   * The persisted/current language may have been deactivated in the database. Recover through
   * the SAME priority chain as a first visit (geo → browser → default) rather than jumping
   * straight to the default, then reload once so translations, LOCALE_ID and direction all
   * rebind — the app must never keep running in an invalid language state.
   */
  private ensureCurrentIsActive(): void {
    const languages = this.languages();
    if (languages.length === 0 || languages.some(l => l.code === this.currentCode())) {
      return;
    }

    const replacement =
      this.detectLanguageFromTimezone()
      ?? this.findActiveBrowserLanguage()
      ?? languages.find(l => l.isDefault)
      ?? languages[0];

    this.currentCode.set(replacement.code);
    this.persist(replacement.code, replacement.direction, 'detected');
    this.writeCultureCookie(replacement.code);
    this.reloadApp();
  }

  /** The browser's preferred language, if it is one of the ACTIVE shop languages. */
  private findActiveBrowserLanguage(): ILanguage | null {
    const browserLanguage = this.document.defaultView?.navigator?.language;
    if (!browserLanguage) {
      return null;
    }
    const code = browserLanguage.split('-')[0].toLowerCase();
    return this.languages().find(l => l.code === code) ?? null;
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
