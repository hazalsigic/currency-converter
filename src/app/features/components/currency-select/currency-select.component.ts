import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Currency } from '@core/models/currency.model';

@Component({
  selector: 'app-currency-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './currency-select.component.html',
  styleUrl: './currency-select.component.scss',
})
export class CurrencySelectComponent {
  readonly currencies = input.required<readonly Currency[]>();
  readonly value = input.required<Currency>();
  readonly label = input<string>('Currency');

  readonly valueChange = output<Currency>();

  protected onChange(event: Event): void {
    const code = (event.target as HTMLSelectElement).value;
    const selectedCurrency = this.currencies().find((c) => c.code === code);
    if (selectedCurrency) this.valueChange.emit(selectedCurrency);
  }
}