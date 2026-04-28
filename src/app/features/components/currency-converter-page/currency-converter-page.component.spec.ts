import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CurrencyConverterPageComponent } from './currency-converter-page.component';
import { CurrencyApiService } from '@core/services/currency-api.service';
import { ConversionResult } from '@core/models/exchange-rate.model';
import { GBP, EUR } from '@core/models/currency.model';

describe('CurrencyConverterPageComponent', () => {
  let fixture: ComponentFixture<CurrencyConverterPageComponent>;
  let component: CurrencyConverterPageComponent;
  let api: jest.Mocked<CurrencyApiService>;

  const sampleResult: ConversionResult = {
    from: GBP,
    to: EUR,
    amount: 1,
    rate: 1.17,
    convertedAmount: 1.17,
    timestamp: 1745740800,
  };

  beforeEach(async () => {
    jest.useFakeTimers();

    api = { convert: jest.fn().mockReturnValue(of(sampleResult)) } as unknown as jest.Mocked<CurrencyApiService>;

    await TestBed.configureTestingModule({
      imports: [CurrencyConverterPageComponent],
      providers: [{ provide: CurrencyApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyConverterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders the page title', () => {
    expect(fixture.nativeElement.querySelector('.converter__title')?.textContent).toContain(
      'Currency Converter',
    );
  });

  it('runs a conversion when the amount changes', () => {
    api.convert.mockClear();
    component['onAmountChange'](500);
    jest.advanceTimersByTime(300);
    expect(api.convert).toHaveBeenCalled();
  });

  it('runs a conversion when the source currency changes', () => {
    api.convert.mockClear();
    component['onSourceChange'](EUR);
    jest.advanceTimersByTime(300);
    expect(api.convert).toHaveBeenCalled();
  });

  it('runs a conversion when the target currency changes', () => {
    api.convert.mockClear();
    component['onTargetChange'](GBP);
    jest.advanceTimersByTime(300);
    expect(api.convert).toHaveBeenCalled();
  });

  it('swap reverses source and target then re-runs the conversion', () => {
    api.convert.mockClear();
    const originalSource = component['store'].source().code;
    component['swap']();
    jest.advanceTimersByTime(300);
    expect(component['store'].target().code).toBe(originalSource);
    expect(api.convert).toHaveBeenCalled();
  });
});