import { Routes } from '@angular/router';

export const CURRENCY_CONVERTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/currency-converter-page/currency-converter-page.component').then(
        (m) => m.CurrencyConverterPageComponent,
      ),
    title: 'Currency Converter',
  },
];