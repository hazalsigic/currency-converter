import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrencySelectComponent } from './currency-select.component';
import { Currency, EUR, GBP } from '@core/models/currency.model';

describe('CurrencySelectComponent', () => {
  let component: CurrencySelectComponent;
  let fixture: ComponentFixture<CurrencySelectComponent>;

  const USD: Currency = { code: 'USD', name: 'US Dollar', symbol: '$' };
  const catalogue: readonly Currency[] = [GBP, EUR, USD];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencySelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencySelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currencies', catalogue);
    fixture.componentRef.setInput('value', GBP);
    fixture.detectChanges();
  });

  it('renders one option per currency in the catalogue', () => {
    const options: NodeListOf<HTMLOptionElement> =
      fixture.nativeElement.querySelectorAll('option');
    expect(options.length).toBe(catalogue.length);
    expect(options[0].value).toBe('GBP');
    expect(options[1].value).toBe('EUR');
    expect(options[2].value).toBe('USD');
  });

  it('reflects the bound value in the native select', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('GBP');
  });

  it('emits the matching Currency when the user picks an option', () => {
    const emit = jest.spyOn(component.valueChange, 'emit');
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = 'USD';
    select.dispatchEvent(new Event('change'));
    expect(emit).toHaveBeenCalledWith(USD);
  });

  it('does not emit when the selected code is not in the catalogue', () => {
    const emit = jest.spyOn(component.valueChange, 'emit');
    component['onChange']({
      target: { value: 'XYZ' } as HTMLSelectElement,
    } as unknown as Event);
    expect(emit).not.toHaveBeenCalled();
  });
});