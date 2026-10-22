import { formatCurrency, getCurrencySymbol } from '@angular/common';

const supportedCurrencies = new Set(Intl.supportedValuesOf('currency'));

/** Validate identity separately from locale; an unknown code must never imply another currency. */
export function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return supportedCurrencies.has(code) ? code : null;
}

export function formatMoney(value: number | null | undefined, currency: unknown, locale: string): string | null {
  const code = normalizeCurrency(currency);
  if (!code || typeof value !== 'number' || !Number.isFinite(value)) return null;
  return formatCurrency(value, locale, getCurrencySymbol(code, 'wide', locale), code, '1.2-2');
}
