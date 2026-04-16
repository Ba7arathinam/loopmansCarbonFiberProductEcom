import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyInr', standalone: true })
export class CurrencyInrPipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    if (value == null || isNaN(value)) return '₹0';
    const num = Math.round(value);
    const str = num.toString();
    const lastThree = str.substring(str.length - 3);
    const rest = str.substring(0, str.length - 3);
    const formatted = rest !== ''
      ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;
    return '₹' + formatted;
  }
}
