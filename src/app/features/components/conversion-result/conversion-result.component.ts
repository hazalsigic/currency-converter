import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ConversionResult } from '@core/models/exchange-rate.model';

@Component({
  selector: 'app-conversion-result',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conversion-result.component.html',
  styleUrl: './conversion-result.component.scss',
})
export class ConversionResultComponent {
  readonly result = input<ConversionResult | null>(null);

  private static readonly formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  protected formatTimestamp(unixSeconds: number): string {
    return ConversionResultComponent.formatter.format(new Date(unixSeconds * 1000));
  }

  protected toIsoString(unixSeconds: number): string {
    return new Date(unixSeconds * 1000).toISOString();
  }
}