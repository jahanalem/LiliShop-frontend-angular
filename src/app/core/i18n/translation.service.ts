import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';

interface LocalizationDictionary {
  culture: string;
  version: number;
  entries: Record<string, string>;
}

interface CachedDictionary extends LocalizationDictionary {
}

const CACHE_KEY_PREFIX = 'ls-i18n:';

/**
 * Runtime translations, loaded from the backend (single source of truth) instead of
 * compile-time JSON bundles — so editing a translation in the database needs no redeploy.
 *
 * Flow per app start: read the cached dictionary for the current language from
 * localStorage (instant, no flash of raw keys) → ask the API for the current global
 * translation version → if it differs, fetch `/api/localization/{culture}?v={version}`
 * (long-cacheable URL; the version acts as the cache-buster) and update the cache.
 *
 * The dictionary is a signal, so templates using the `translate` pipe re-render when it
 * loads. The backend embeds the fallback chain (requested culture → default culture), and
 * a missing key falls back to the key itself, logged once per key.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);
  private languageService = inject(LanguageService);
  private storageService = inject(StorageService);

  private readonly dictionary = signal<Record<string, string>>({});
  readonly version = signal<number | null>(null);
  readonly isLoaded = computed(() => Object.keys(this.dictionary()).length > 0);

  private readonly warnedKeys = new Set<string>();

  /**
   * Called once at startup (app.config.ts). Non-blocking: the cached dictionary is
   * applied synchronously, the network refresh happens in the background.
   */
  initialize(): void {
    const culture = this.languageService.currentCode();

    const cached = this.storageService.get<CachedDictionary>(CACHE_KEY_PREFIX + culture);
    if (cached?.entries) {
      this.dictionary.set(cached.entries);
      this.version.set(cached.version);
    }

    void this.refresh(culture, cached?.version ?? null);
  }

  /**
   * Translates a key. `params` supports both positional composite-format placeholders
   * ({0}, {1} — the backend seed convention) and named ones ({count}).
   * Missing keys return the key itself and log a warning once.
   */
  translate(key: string, params?: Record<string, unknown> | unknown[]): string {
    const value = this.dictionary()[key];

    if (value === undefined) {
      if (this.isLoaded() && !this.warnedKeys.has(key)) {
        this.warnedKeys.add(key);
        console.warn(`[i18n] Missing translation for key '${key}' (culture '${this.languageService.currentCode()}').`);
      }
      return key;
    }

    return params ? this.interpolate(value, params) : value;
  }

  private async refresh(culture: string, cachedVersion: number | null): Promise<void> {
    try {
      const { version } = await firstValueFrom(
        this.http.get<{ version: number }>(`${environment.apiUrl}localization/version`));

      if (version === cachedVersion && this.isLoaded()) {
        return; // Cache is current — no dictionary download needed.
      }

      const dictionary = await firstValueFrom(
        this.http.get<LocalizationDictionary>(`${environment.apiUrl}localization/${culture}?v=${version}`));

      this.dictionary.set(dictionary.entries ?? {});
      this.version.set(dictionary.version);
      this.storageService.set<CachedDictionary>(CACHE_KEY_PREFIX + culture, {
        culture: dictionary.culture,
        version: dictionary.version,
        entries: dictionary.entries ?? {},
      });
    } catch {
      // Translations are non-critical for keeping the shop usable: with a warm cache the
      // user sees the last known texts; on a cold start the pipe falls back to the keys.
    }
  }

  private interpolate(template: string, params: Record<string, unknown> | unknown[]): string {
    if (Array.isArray(params)) {
      return template.replace(/\{(\d+)\}/g, (match, index) =>
        index < params.length ? String(params[Number(index)]) : match);
    }

    return template.replace(/\{(\w+)\}/g, (match, name) =>
      name in params ? String((params as Record<string, unknown>)[name]) : match);
  }
}
