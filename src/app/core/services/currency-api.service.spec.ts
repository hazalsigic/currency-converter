import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { CurrencyApiService } from './currency-api.service';
import { Currency } from '@core/models/currency.model';
import { ExchangeRateResponse } from '@core/models/exchange-rate.model';
import { environment } from '@env/environment';

describe('CurrencyApiService', () => {
  let service: CurrencyApiService;
  let httpMock: HttpTestingController;

  const USD: Currency = { code: 'USD', name: 'US Dollar', symbol: '$' };
  const EUR: Currency = { code: 'EUR', name: 'Euro', symbol: '€' };
  const GBP: Currency = { code: 'GBP', name: 'British Pound', symbol: '£' };

  /*successful response*/
  const ratesResponse: ExchangeRateResponse = {
    success: true,
    timestamp: 1735000000,
    base: 'EUR',
    date: '2026-04-27',
    rates: { USD: 1.08, GBP: 0.85 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CurrencyApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  //input validation

  it('rejects negative amounts without making an HTTP call', async () => {
    await expect(firstValueFrom(service.convert(USD, EUR, -5))).rejects.toMatchObject({
      message: expect.stringContaining('non-negative'),
    });
    httpMock.expectNone(() => true);
  });

  it('rejects NaN amounts without making an HTTP call', async () => {
    await expect(firstValueFrom(service.convert(USD, EUR, Number.NaN))).rejects.toMatchObject({
      message: expect.stringContaining('non-negative'),
    });
    httpMock.expectNone(() => true);
  });

  it('rejects Infinity amounts without making an HTTP call', async () => {
    await expect(firstValueFrom(service.convert(USD, EUR, Infinity))).rejects.toMatchObject({
      message: expect.stringContaining('non-negative'),
    });
    httpMock.expectNone(() => true);
  });

  //shortcut path

  it('returns rate of 1 when source equals target — no HTTP call', async () => {
    const result = await firstValueFrom(service.convert(USD, USD, 100));
    expect(result.rate).toBe(1);
    expect(result.convertedAmount).toBe(100);
    httpMock.expectNone(() => true);
  });

  it('handles zero amount as a valid input', async () => {
    const promise = firstValueFrom(service.convert(USD, GBP, 0));
    httpMock.expectOne((req) => req.url.includes('/latest')).flush(ratesResponse);
    const result = await promise;
    expect(result.convertedAmount).toBe(0);
  });

  //cross-rate maths

  it('computes EUR → X directly using the EUR-based rate', async () => {
    // 1 EUR = 1.08 USD, so 100 EUR = 108 USD
    const promise = firstValueFrom(service.convert(EUR, USD, 100));
    httpMock.expectOne((req) => req.url.includes('/latest')).flush(ratesResponse);
    const result = await promise;
    expect(result.rate).toBeCloseTo(1.08, 5);
    expect(result.convertedAmount).toBeCloseTo(108, 5);
  });

  it('computes X → EUR as the inverse of EUR → X', async () => {
    // 1 USD = 1/1.08 EUR, so 108 USD ≈ 100 EUR
    const promise = firstValueFrom(service.convert(USD, EUR, 108));
    httpMock.expectOne((req) => req.url.includes('/latest')).flush(ratesResponse);
    const result = await promise;
    expect(result.rate).toBeCloseTo(1 / 1.08, 5);
    expect(result.convertedAmount).toBeCloseTo(100, 2);
  });

  it('computes cross-rate for non-EUR pairs (USD → GBP)', async () => {
    // rate(USD→GBP) = rate(EUR→GBP) / rate(EUR→USD) = 0.85 / 1.08
    const promise = firstValueFrom(service.convert(USD, GBP, 100));
    httpMock.expectOne((req) => req.url.includes('/latest')).flush(ratesResponse);
    const result = await promise;
    expect(result.rate).toBeCloseTo(0.85 / 1.08, 5);
    expect(result.convertedAmount).toBeCloseTo(100 * (0.85 / 1.08), 2);
  });

  // request shape

  it('calls the configured Fixer URL with access_key and symbols params', async () => {
    const promise = firstValueFrom(service.convert(USD, GBP, 50));
    const req = httpMock.expectOne((r) => r.url === `${environment.fixerApiUrl}/latest`);
    expect(req.request.params.get('access_key')).toBe(environment.fixerApiKey);
    expect(req.request.params.get('symbols')).toBe('USD,GBP');
    req.flush(ratesResponse);
    await promise;
  });

  // error handling

  it('translates a Fixer error response into an ApiError', async () => {
    const promise = firstValueFrom(service.convert(USD, GBP, 100));
    httpMock.expectOne((r) => r.url.includes('/latest')).flush({
      success: false,
      error: { code: 101, type: 'invalid_access_key', info: 'Invalid API key.' },
    });
    await expect(promise).rejects.toMatchObject({
      message: 'Invalid API key.',
      code: '101',
    });
  });

  it('translates a network failure into an ApiError', async () => {
    const promise = firstValueFrom(service.convert(USD, GBP, 100));
    httpMock
      .expectOne((r) => r.url.includes('/latest'))
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Network error' });
    await expect(promise).rejects.toMatchObject({
      message: expect.any(String),
      statusCode: 0,
    });
  });

  it('throws when the upstream omits a required rate', async () => {
    const promise = firstValueFrom(service.convert(USD, GBP, 100));
    httpMock.expectOne((r) => r.url.includes('/latest')).flush({
      ...ratesResponse,
      rates: { USD: 1.08 }, 
    } satisfies ExchangeRateResponse);
    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining('GBP'),
    });
  });
});