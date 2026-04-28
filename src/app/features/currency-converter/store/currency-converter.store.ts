import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { debounceTime, pipe, switchMap, tap } from 'rxjs';

import { CurrencyApiService } from '@core/services/currency-api.service';
import {
  Currency,
  EUR,
  GBP,
  SUPPORTED_CURRENCIES,
} from '@core/models/currency.model';
import { ApiError, ConversionResult } from '@core/models/exchange-rate.model';

interface CurrencyConverterState {
  readonly currencies: readonly Currency[];
  readonly amount: number;
  readonly source: Currency;
  readonly target: Currency;
  readonly result: ConversionResult | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/** Default state*/
const initialState: CurrencyConverterState = {
  currencies: SUPPORTED_CURRENCIES,
  amount: 1,
  source: GBP,
  target: EUR,
  result: null,
  loading: false,
  error: null,
};

interface ConvertParams {
  readonly source: Currency;
  readonly target: Currency;
  readonly amount: number;
}

/**signal store */
export const CurrencyConverterStore = signalStore(
  withState<CurrencyConverterState>(initialState),

  withComputed((state) => ({
    isSameCurrency: computed(() => state.source().code === state.target().code),
  })),

  withMethods((store, api = inject(CurrencyApiService)) => ({
    setAmount(amount: number): void {
      patchState(store, { amount, error: null });
    },

    setSource(source: Currency): void {
      patchState(store, { source, error: null });
    },

    setTarget(target: Currency): void {
      patchState(store, { target, error: null });
    },

    swap(): void {
      patchState(store, {
        source: store.target(),
        target: store.source(),
        error: null,
      });
    },

    convert: rxMethod<ConvertParams>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        debounceTime(300),
        switchMap(({ source, target, amount }) =>
          api.convert(source, target, amount).pipe(
            tapResponse({
              next: (result) => patchState(store, { result, loading: false }),
              error: (err: ApiError) =>
                patchState(store, {
                  loading: false,
                  error: err.message ?? 'Conversion failed.',
                }),
            }),
          ),
        ),
      ),
    ),
  })),

  withHooks({
    onInit(store) {
      store.convert(
        toObservable(
          computed(() => ({
            source: store.source(),
            target: store.target(),
            amount: store.amount(),
          })),
        ),
      );
    },
  }),
);
