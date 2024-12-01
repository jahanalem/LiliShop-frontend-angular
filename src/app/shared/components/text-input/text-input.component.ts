
import { Component, OnInit, ChangeDetectionStrategy, viewChild, Self, input, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { errorType } from '../../constants/error-types';
import { ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-text-input',
    templateUrl: './text-input.component.html',
    styleUrls: ['./text-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class TextInputComponent implements OnInit, OnDestroy, ControlValueAccessor {
  input = viewChild.required<ElementRef>('input');

  type         = input<string>('text');
  label        = input<string>('')
  autocomplete = input<string>('');

  protected onChange  = (_value: any) => { };
  protected onTouched = () => { };

  private destroy$ = new Subject<void>();

  cdr = inject(ChangeDetectorRef);

  constructor(@Self() public controlDir: NgControl) {
    this.controlDir.valueAccessor = this;
  }

  ngOnInit(): void {
    const control = this.controlDir.control;
    if (control) {
      control.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.cdr.markForCheck();
      });
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.cdr.markForCheck();
      });
      control.setValidators(control.validator ? [control.validator] : []);
      control.setAsyncValidators(control.asyncValidator ? [control.asyncValidator] : []);
      control.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  get formControl(): FormControl {
    return this.controlDir.control as FormControl;
  }
  writeValue(obj: any): void {
    if (this.input().nativeElement.value !== obj) {
      this.input().nativeElement.value = obj || '';
    }
  }

  onInputChange(value: any): void {
    this.onChange(value);
    this.cdr.detectChanges();
  }

  onInputBlur(): void {
    this.controlDir.control?.markAsTouched();
    this.onTouched();
    this.cdr.detectChanges();
  }
  handleFocusOut(): void {
    // Trigger validation when user leaves the input field (using Tab, click, etc.)
    this.controlDir.control?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  isThereAnyRequiredErrorType(): boolean | null {
    this.cdr.markForCheck();
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
