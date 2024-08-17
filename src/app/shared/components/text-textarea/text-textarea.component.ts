import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { Component, OnInit, ElementRef, Self, viewChild, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-text-textarea',
  templateUrl: './text-textarea.component.html',
  styleUrls: ['./text-textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextTextareaComponent implements OnInit, ControlValueAccessor {
  textarea = viewChild.required<ElementRef>('textarea');

  label = input<string>('');
  rows  = input<number>(4);

  protected onChanged!: Function;
  protected onTouched!: Function;

  constructor(@Self() public controlDir: NgControl) {
    this.controlDir.valueAccessor = this;
  }

  ngOnInit(): void {
    const control = this.controlDir.control;
    const validators = control?.validator ? [control.validator] : [];
    const asyncValidators = control?.asyncValidator ? [control.asyncValidator] : [];

    control?.setValidators(validators);
    control?.setAsyncValidators(asyncValidators);
    control?.updateValueAndValidity();
  }
  get formControl(): FormControl {
    return this.controlDir.control as FormControl;
  }
  
  writeValue(obj: any): void {
    this.textarea().nativeElement.value = obj || '';
  }
  registerOnChange(fn: any): void {
    this.onChanged = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  isThereAnyRequiredErrorType(): boolean | null {
    return this.controlDir.control?.errors ? this.controlDir.control?.errors['required'] ? true : false : null;
  }
}
