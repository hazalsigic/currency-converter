import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '@env/environment';
import {
  ExchangeRateErrorResponse,
  ExchangeRateResponse,
  ApiError,
  ConversionResult,
} from '@core/models/exchange-rate.model';
import { Currency } from '@core/models/currency.model';

@Injectable({ providedIn: 'root' })
export class CurrencyApiService {
  private readonly http = inject(HttpClient);

  /* Convert `amount` from `from` to `to`*/
  convert(from: Currency, to: Currency, amount: number): Observable<ConversionResult> {
    if (amount < 0 || !Number.isFinite(amount)) {
      return throwError(() => this.toApiError('Amount must be a non-negative number.'));
    }

    // Same currency
    if (from.code === to.code) {
      return of(this.buildResult(from, to, amount, 1, this.now()));
    }

    return this.fetchEurRates([from.code, to.code]).pipe(
      map((response) => {
        const rate = this.computeCrossRate(from.code, to.code, response.rates);
        return this.buildResult(from, to, amount, rate, response.timestamp);
      }),
    );
  }

  private fetchEurRates(symbols: readonly string[]): Observable<ExchangeRateResponse> {
    const url = `${environment.fixerApiUrl}/latest`;
    const params = {
      access_key: environment.fixerApiKey,
      symbols: symbols.join(','),
    };

    return this.http.get<ExchangeRateResponse | ExchangeRateErrorResponse>(url, { params }).pipe(
      map((res) => {
        if (!res.success) {
          const err = res as ExchangeRateErrorResponse;
          throw this.toApiError(
            err.error?.info ?? 'Exchange-rate provider error.',
            err.error?.code,
          );
        }
        return res as ExchangeRateResponse;
      }),
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          return throwError(() => this.normaliseHttpError(err));
        }
        return throwError(() => err);
      }),
    );
  }

  /*Cross-rate computation. All input rates are EUR-based.*/
  private computeCrossRate(
    fromCode: string,
    toCode: string,
    eurRates: Readonly<Record<string, number>>,
  ): number {
    if (fromCode === 'EUR') {
      const rate = eurRates[toCode];
      this.assertRate(rate, toCode);
      return rate;
    }
    if (toCode === 'EUR') {
      const rate = eurRates[fromCode];
      this.assertRate(rate, fromCode);
      return 1 / rate;
    }
    const fromRate = eurRates[fromCode];
    const toRate = eurRates[toCode];
    this.assertRate(fromRate, fromCode);
    this.assertRate(toRate, toCode);
    return toRate / fromRate;
  }

  private assertRate(rate: number | undefined, code: string): asserts rate is number {
    if (typeof rate !== 'number' || rate <= 0) {
      throw this.toApiError(`Missing or invalid rate for ${code}.`);
    }
  }

  private buildResult(
    from: Currency,
    to: Currency,
    amount: number,
    rate: number,
    timestamp: number,
  ): ConversionResult {
    return {
      from,
      to,
      amount,
      rate,
      convertedAmount: amount * rate,
      timestamp,
    };
  }

  private now(): number {
    return Math.floor(Date.now() / 1000);
  }

  private normaliseHttpError(err: HttpErrorResponse): ApiError {
    return { message: err.message, statusCode: err.status };
  }

  private toApiError(message: string, code?: number | string): ApiError {
    return { message, code: code !== undefined ? String(code) : undefined };
  }
}
