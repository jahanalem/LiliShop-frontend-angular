import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatValue'
})
export class FormatValuePipe implements PipeTransform {

  transform(value: any, columnName: string): any {
    switch (columnName.toLowerCase()) {
      case 'price':
        return `$${value.toFixed(2)}`; // Formats value as currency
      case 'quantity':
        return `${value} units`; // Adds "units" to the end of the value
      default:
        return value; // Returns the original value if no formatting rules apply
    }
  }

}
