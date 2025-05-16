import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { IProduct } from '../models/product';

@Pipe({
  name: 'formatValue',
  standalone: false
})
export class FormatValuePipe implements PipeTransform {

  transform(value: any, columnName: string, context?:any): any {
    if (value == null) return '-';

    switch (columnName) {
      case 'price':
        return `$${value.toFixed(2)}`; // Formats value as currency
      case 'quantity':
        return `${value} units`; // Adds "units" to the end of the value
      case 'createdDate':
      case 'startDate':
      case 'endDate':
        return formatDate(value, 'MMM d, y, h:mm a', 'en-US');
      case 'message':
        return value.length > 200 ? `${value.substr(0, 200)}...` : value;
      case 'isDiscountActive':
        const product = context as IProduct;
        if (product.discount?.isActive && product.scheduledPrice != null) {
          return 'Scheduled';
        } else if (product?.discount?.isActive) {
          return 'Yes';
        } else {
          return 'No';
        }
      default:
        return value;
    }
  }

}
