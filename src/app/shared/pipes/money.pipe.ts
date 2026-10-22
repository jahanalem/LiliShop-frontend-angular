import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { formatMoney } from '../currency';

export function unavailableCurrency(translations: TranslationService): string {
  const key = TranslationKeys.Currency.Unavailable;
  const value = translations.translate(key);
  return value === key ? 'Currency unavailable' : value;
}

/** Explicit currency is required: a missing historical code never falls back to the shop or Angular default. */
@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  private readonly translations = inject(TranslationService);

  transform(value: number | null | undefined, currency: unknown): string {
    return formatMoney(value, currency, this.locale) ?? unavailableCurrency(this.translations);
  }
}
