import { Component, OnInit, ViewChild, ElementRef, Input, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { errorType } from '../../constants/error-types';

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss']
})
export class TextInputComponent implements OnInit, ControlValueAccessor {
  @ViewChild('input', { static: true }) input: ElementRef = {} as ElementRef;
  @Input() type = 'text';
  @Input() label: string = {} as string;
  @Input() autocomplete: string = '';
  
  protected onChange!: Function;
  protected onTouched!: Function;

  /*
    The @Self decorator instructs Angular to look for the dependency only in the local injector.
    The local injector is the injector that is part of the current component or directive.
    https://www.tektutorialshub.com/angular/self-skipself-optional-decorators-angular/

    We’re injecting the NgControl which is the super class of both formControlName and ngModel,
    with that, we’re not coupling our form control to any of the template or reactive module.
    NgControl already provides the NG_VALUE_ACCESSOR and the NG_VALIDATOR tokens.
    If we provide them in the TextInputComponent class we might run into circular dependency issues
    https://medium.com/angular-in-depth/reducing-the-forms-boilerplate-make-your-angular-forms-reusable-ee06d7c07f47

    In order to access the validation, we need to get access to the control itself.
    And the way that we can do this is to inject it into our constructor here.
    And that means we'll be able to access its properties and validated inside these components.
  */
  constructor(@Self() public controlDir: NgControl) {

    /*
      And what 'this' does, this binds this to our class.
      And now we've got access to our control Directive inside our component
      and will have access to it inside our template as well.
    */
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
    this.input.nativeElement.value = obj || '';
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  isThereAnyRequiredErrorType(): boolean | null {
    return this.controlDir.control?.errors ? this.controlDir.control?.errors['required'] ? true : false : null;
  }

  isEmailAddressInvalid(): boolean | null {
    return this.controlDir?.control?.errors ? (this.controlDir?.name === 'email' && this.controlDir?.control?.errors['pattern']) ? true : false : null;
  }

  isEmailAlreadyTaken() {
    return this.controlDir?.control?.errors ? this.controlDir?.control?.errors[errorType.EMAIL_EXISTS] ? true : false : null;
  }

  isThereMatchEmailErrorType(): boolean | null {
    return this.controlDir.control?.errors ? this.controlDir.control?.errors[errorType.MATCHING] ? true : false : null;
  }

  isPasswordInvalid(): boolean | null {
    return this.controlDir?.control?.errors ? (this.controlDir?.name === 'password' && this.controlDir?.control?.errors['pattern']) ? true : false : null;
  }
}
