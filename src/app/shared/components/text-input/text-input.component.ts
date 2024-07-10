
import { Component, OnInit, ChangeDetectionStrategy, viewChild, Self, input } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { errorType } from '../../constants/error-types';
import { ElementRef } from '@angular/core';

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextInputComponent implements OnInit, ControlValueAccessor {
  input        = viewChild.required<ElementRef>('input');

  type         = input<string>('text');
  label        = input<string>('')
  autocomplete = input<string>('');

  protected onChange!: Function;
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

  writeValue(obj: any): void {
    this.input().nativeElement.value = obj || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  isThereAnyRequiredErrorType(): boolean | null {
    return this.controlDir.control?.errors ? this.controlDir.control.errors['required'] ? true : false : null;
  }

  isEmailAddressInvalid(): boolean | null {
    return this.controlDir.control?.errors ? (this.controlDir.name === 'email' && this.controlDir.control.errors['pattern']) ? true : false : null;
  }

  isEmailAlreadyTaken(): boolean | null {
    return this.controlDir.control?.errors ? this.controlDir.control.errors[errorType.EMAIL_EXISTS] ? true : false : null;
  }

  isThereMatchEmailErrorType(): boolean | null {
    return this.controlDir.control?.errors ? this.controlDir.control.errors[errorType.MATCHING] ? true : false : null;
  }

  isPasswordInvalid(): boolean | null {
    return this.controlDir.control?.errors ? (this.controlDir.name === 'password' && this.controlDir.control.errors['pattern']) ? true : false : null;
  }
}
