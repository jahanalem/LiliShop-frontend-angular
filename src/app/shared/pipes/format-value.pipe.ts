import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatValue',
    standalone: false
})
export class FormatValuePipe implements PipeTransform {

  transform(value: any, columnName: string): any {
    switch (columnName) {
      case 'price':
        return `$${value.toFixed(2)}`; // Formats value as currency
      case 'quantity':
        return `${value} units`; // Adds "units" to the end of the value
      case 'createdDate':
        return formatDate(value, 'MMM d, y, h:mm a', 'en-US');
      case 'message':
        return value.length > 200 ? `${value.substr(0, 200)}...` : value;
      default:
        return value;
    }
  }

}
