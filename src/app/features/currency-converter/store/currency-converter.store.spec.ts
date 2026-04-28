import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CurrencyConverterStore } from './currency-converter.store';
import { CurrencyApiService } from '@core/services/currency-api.service';
import { Currency, EUR, GBP } from '@core/models/currency.model';
import { ApiError, ConversionResult } from '@core/models/exchange-rate.model';

describe('CurrencyConverterStore', () => {
  let api: jest.Mocked<CurrencyApiService>;

  const USD: Currency = { code: 'USD', name: 'US Dollar', symbol: '$' };

  /** successful result */
  const sampleResult: ConversionResult = {
    from: GBP,
    to: EUR,
    amount: 1,
    rate: 1.17,
    convertedAmount: 1.17,
    timestamp: 1745740800,
  };

  beforeEach(() => {
    jest.useFakeTimers();

    api = { convert: jest.fn().mockReturnValue(of(sampleResult)) } as unknown as jest.Mocked<CurrencyApiService>;

    TestBed.configureTestingModule({
      providers: [
        CurrencyConverterStore,
        { provide: CurrencyApiService, useValue: api },
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // initial state

  it('initialises with sensible UK defaults', () => {
    const store = TestBed.inject(CurrencyConverterStore);
    expect(store.amount()).toBe(1);
    expect(store.source().code).toBe('GBP');
    expect(store.target().code).toBe('EUR');
    expect(store.currencies().length).toBeGreaterThan(0);
  });

  it('runs an initial conversion on creation', () => {
    TestBed.inject(CurrencyConverterStore);
    jest.advanceTimersByTime(300);
    expect(api.convert).toHaveBeenCalledTimes(1);
    expect(api.convert).toHaveBeenCalledWith(GBP, EUR, 1);
  });

  // setters

  it('setAmount updates amount and clears any error', () => {
    const store = TestBed.inject(CurrencyConverterStore);
    store.setAmount(250);
    expect(store.amount()).toBe(250);
    expect(store.error()).toBeNull();
  });

  it('setSource and setTarget update the respective signals and clear any error', () => {
    const store = TestBed.inject(CurrencyConverterStore);
    api.convert.mockReturnValue(throwError(() => ({ message: 'fail' })));
    jest.advanceTimersByTime(300);

    store.setSource(USD);
    expect(store.source().code).toBe('USD');
    expect(store.error()).toBeNull();

    store.setTarget(GBP);
    expect(store.target().code).toBe('GBP');
    expect(store.error()).toBeNull();
  });

  it('swap clears any existing error', () => {
    const store = TestBed.inject(CurrencyConverterStore);
    api.convert.mockReturnValue(throwError(() => ({ message: 'fail' })));
    jest.advanceTimersByTime(300);
    expect(store.error()).toBe('fail');

    store.swap();
    expect(store.error()).toBeNull();
  });

  // swap

  it('swap reverses source and target without clearing the previous result', () => {
    const store = TestBed.inject(CurrencyConverterStore);
    const originalSource = store.source();
    const originalTarget = store.target();
    const previousResult = store.result();

    store.swap();

    expect(store.source()).toEqual(originalTarget);
    expect(store.target()).toEqual(originalSource);
    expect(store.result()).toEqual(previousResult);
  });

  // computed signals

it('isSameCurrency reflects whether source and target match', () => {
    const store = TestBed.inject(CurrencyConverterStore);
    expect(store.isSameCurrency()).toBe(false);
    store.setTarget(store.source());
    expect(store.isSameCurrency()).toBe(true);
  });

  // loading state

  it('sets loading immediately on state change before the debounce settles', () => {
    const store = TestBed.inject(CurrencyConverterStore);
    store.setAmount(50);
    TestBed.flushEffects();
    expect(store.loading()).toBe(true);
    expect(store.result()).toBeNull();
  });

  //convert success path

  it('stores the result on a successful conversion', () => {
    const store = TestBed.inject(CurrencyConverterStore);
    jest.advanceTimersByTime(300);
    expect(store.result()).toEqual(sampleResult);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  //convert error path

  it('stores the error message on a failed conversion', () => {
    const failure: ApiError = { message: 'API down', statusCode: 503 };
    api.convert.mockReturnValue(throwError(() => failure));

    const store = TestBed.inject(CurrencyConverterStore);
    jest.advanceTimersByTime(300);
    expect(store.error()).toBe('API down');
    expect(store.loading()).toBe(false);
    expect(store.result()).toBeNull();
  });

});