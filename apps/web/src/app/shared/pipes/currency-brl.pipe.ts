import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyBrl' })
export default class CurrencyBrlPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  }
}

