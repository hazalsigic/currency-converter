import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmountInputComponent } from './amount-input.component';

describe('AmountInputComponent', () => {
  let component: AmountInputComponent;
  let fixture: ComponentFixture<AmountInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmountInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AmountInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fireInput(value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('renders the input with the default value', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input).toBeTruthy();
    expect(input.value).toBe('0');
  });

  it('emits the parsed numeric value on input', () => {
    const emit = jest.spyOn(component.valueChange, 'emit');
    fireInput('42.5');
    expect(emit).toHaveBeenCalledWith(42.5);
  });

  it('emits 0 for invalid input', () => {
    const emit = jest.spyOn(component.valueChange, 'emit');
    fireInput('abc');
    expect(emit).toHaveBeenCalledWith(0);
  });

  it('emits 0 for negative input', () => {
    const emit = jest.spyOn(component.valueChange, 'emit');
    fireInput('-5');
    expect(emit).toHaveBeenCalledWith(0);
  });

  it('emits 0 for empty input', () => {
    const emit = jest.spyOn(component.valueChange, 'emit');
    fireInput('');
    expect(emit).toHaveBeenCalledWith(0);
  });
});