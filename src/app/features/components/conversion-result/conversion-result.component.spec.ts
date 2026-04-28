import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConversionResultComponent } from './conversion-result.component';
import { ConversionResult } from '@core/models/exchange-rate.model';
import { GBP, EUR } from '@core/models/currency.model';

describe('ConversionResultComponent', () => {
  let fixture: ComponentFixture<ConversionResultComponent>;

  const sampleResult: ConversionResult = {
    from: GBP,
    to: EUR,
    amount: 100,
    convertedAmount: 117.42,
    rate: 1.1742,
    timestamp: 1777291200,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversionResultComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversionResultComponent);
  });

  it('renders nothing when result is null', () => {
    fixture.componentRef.setInput('result', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result')).toBeFalsy();
  });

  it('renders the converted amount, currencies, and rate when a result is provided', () => {
    fixture.componentRef.setInput('result', sampleResult);
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('GBP');
    expect(text).toContain('EUR');
    expect(text).toContain('117.42');
  });

  it('shows the rate using the from-currency code', () => {
    fixture.componentRef.setInput('result', sampleResult);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 GBP');
  });

  it('shows a formatted date and time', () => {
    fixture.componentRef.setInput('result', sampleResult);
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Apr');
    expect(text).toContain('2026');
  });

  it('sets the datetime attribute to an ISO 8601 string', () => {
    fixture.componentRef.setInput('result', sampleResult);
    fixture.detectChanges();
    const time: HTMLTimeElement = fixture.nativeElement.querySelector('time');
    expect(time.getAttribute('datetime')).toBe(
      new Date(sampleResult.timestamp * 1000).toISOString(),
    );
  });
});