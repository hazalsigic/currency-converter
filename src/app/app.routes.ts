import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/currency-converter/currency-converter.routes').then(
        (m) => m.CURRENCY_CONVERTER_ROUTES,
      ),
  },
  { path: '**', redirectTo: '' },
];
