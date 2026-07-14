import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import localeDa from '@angular/common/locales/da';
import localeDe from '@angular/common/locales/de';
import localeEs from '@angular/common/locales/es';
import localeFa from '@angular/common/locales/fa';
import localeHi from '@angular/common/locales/hi';
import localeRu from '@angular/common/locales/ru';
import localeSv from '@angular/common/locales/sv';
import localeTr from '@angular/common/locales/tr';
import localeZh from '@angular/common/locales/zh';

/**
 * CLDR locale data is bundled at compile time, so every locale the shop may
 * activate is registered up front (a few KB each). Activating one of these
 * languages later is then a pure database change — no frontend release.
 * English is built into Angular and needs no registration.
 */
export const REGISTERED_LOCALES: ReadonlySet<string> = new Set([
  'en', 'de', 'fa', 'ru', 'tr', 'ar', 'da', 'es', 'hi', 'zh', 'sv',
]);

export function registerAppLocales(): void {
  registerLocaleData(localeDe);
  registerLocaleData(localeFa);
  registerLocaleData(localeRu);
  registerLocaleData(localeTr);
  registerLocaleData(localeAr);
  registerLocaleData(localeDa);
  registerLocaleData(localeEs);
  registerLocaleData(localeHi);
  registerLocaleData(localeZh);
  registerLocaleData(localeSv);
}
