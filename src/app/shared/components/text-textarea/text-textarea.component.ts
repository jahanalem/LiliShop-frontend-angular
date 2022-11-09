import { ControlValueAccessor, NgControl } from '@angular/forms';
import { Component, OnInit, ViewChild, ElementRef, Input, Self } from '@angular/core';

@Component({
  selector: 'app-text-textarea',
  templateUrl: './text-textarea.component.html',
  styleUrls: ['./text-textarea.component.scss']
})
export class TextTextareaComponent implements OnInit, ControlValueAccessor {
  @ViewChild('textarea', { static: true }) textarea: ElementRef = {} as ElementRef;
  @Input() label: string = {} as string;
  @Input() rows: number = 4;

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

  writeValue(obj: any): void {
    this.textarea.nativeElement.value = obj || '';
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
