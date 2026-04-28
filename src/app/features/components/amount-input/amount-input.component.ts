import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';


@Component({
  selector: 'app-amount-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './amount-input.component.html',
  styleUrl: './amount-input.component.scss',
})
export class AmountInputComponent {
  readonly value = input<number>(0);
  readonly label = input<string>('Amount');

  readonly valueChange = output<number>();

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = Number.parseFloat(raw);
    this.valueChange.emit(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
  }
}