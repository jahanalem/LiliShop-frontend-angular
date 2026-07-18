import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { IProduct } from '../models/product';
import { IDiscount } from '../models/discount-system';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Pipe({
  name: 'formatValue',
  standalone: true
})
export class FormatValuePipe implements PipeTransform {
  // Language switches reload the app, so LOCALE_ID and the dictionary are stable for the
  // lifetime of this (pure) pipe — same reasoning as the app-wide LOCALE_ID binding.
  private locale = inject(LOCALE_ID);
  private translationService = inject(TranslationService);

  transform(value: any, columnName: string, context?: any): any {
    if (value == null) return '-';

    switch (columnName) {
      case 'price':
        return `$${value.toFixed(2)}`; // Formats value as currency
      case 'quantity':
        return this.translationService.translate(TranslationKeys.Admin.Common.Units, [value]);
      case 'createdDate':
      case 'startDate':
      case 'endDate':
        return formatDate(value, 'MMM d, y, h:mm a', this.locale);
      case 'message':
        return value.length > 200 ? `${value.substr(0, 200)}...` : value;
      case 'isDiscountActive': {
        const product = context as IProduct;
        return this.yesNo(!!product?.previousPrice);
      }
      case 'isActive': {
        // Tables that pass the row as context (discounts, products) read the flag from it;
        // plain cells (brands, types, attributes) fall back to the cell value itself.
        const flag = context != null ? !!(context as IDiscount)?.isActive : !!value;
        return this.yesNo(flag);
      }
      default:
        return value;
    }
  }

  private yesNo(value: boolean): string {
    return this.translationService.translate(value ? TranslationKeys.Common.Yes : TranslationKeys.Common.No);
  }
}
