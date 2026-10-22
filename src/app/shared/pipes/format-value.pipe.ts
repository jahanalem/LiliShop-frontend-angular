import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { IProduct } from '../models/product';
import { IDiscount } from '../models/discount-system';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { ShopCurrencyService } from 'src/app/core/services/shop-currency.service';
import { formatMoney } from '../currency';
import { unavailableCurrency } from './money.pipe';

@Pipe({
  name: 'formatValue',
  standalone: true,
  pure: false
})
export class FormatValuePipe implements PipeTransform {
  // Currency may arrive after the table first renders; refresh when its signal changes.
  private shopCurrency = inject(ShopCurrencyService);
  private locale = inject(LOCALE_ID);
  private translationService = inject(TranslationService);

  transform(value: any, columnName: string, context?: any): any {
    if (value == null) return '-';

    switch (columnName) {
      case 'price':
        return formatMoney(value, this.shopCurrency.currency(), this.locale) ?? unavailableCurrency(this.translationService);
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
