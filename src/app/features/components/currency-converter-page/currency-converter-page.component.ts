import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Currency } from '@core/models/currency.model';
import { CurrencyConverterStore } from '../../currency-converter/store/currency-converter.store';
import { AmountInputComponent } from '../amount-input/amount-input.component';
import { CurrencySelectComponent } from '../currency-select/currency-select.component';
import { ConversionResultComponent } from '../conversion-result/conversion-result.component';


@Component({
  selector: 'app-currency-converter-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountInputComponent, CurrencySelectComponent, ConversionResultComponent],
  providers: [CurrencyConverterStore],
  templateUrl: './currency-converter-page.component.html',
  styleUrl: './currency-converter-page.component.scss',
})
export class CurrencyConverterPageComponent {
  protected readonly store = inject(CurrencyConverterStore);

  protected onAmountChange(value: number): void {
    this.store.setAmount(value);
  }

  protected onSourceChange(currency: Currency): void {
    this.store.setSource(currency);
  }

  protected onTargetChange(currency: Currency): void {
    this.store.setTarget(currency);
  }

  protected swap(): void {
    this.store.swap();
  }
}
