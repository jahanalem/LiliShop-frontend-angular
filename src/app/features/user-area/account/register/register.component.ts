import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, timer, map, of, catchError, tap, EMPTY, Observable, filter } from 'rxjs';
import { pattern } from 'src/app/shared/constants/patterns';
import { errorType } from 'src/app/shared/constants/error-types';
import { AccountService } from 'src/app/core/services/account.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errors: string[] = [];
  private emailCache: { [email: string]: boolean } = {}; // A cache for already verified email addresses
  constructor(private fb: FormBuilder, private accountService: AccountService, private router: Router) { }

  ngOnInit(): void {
    this.createRegisterForm();
  }


  createRegisterForm() {
    this.registerForm = this.fb.group(
      {
        displayName:
          [
            null,
            Validators.required
          ],
        email:
          [
            null,
            [Validators.required, Validators.pattern(pattern.EMAIL)],
            [this.validateEmailNotTaken()]
          ],
        password:
          [
            null,
            [
              Validators.required,
              this.matchPasswordValidator('confirmPassword', true),
              Validators.pattern(pattern.PASSWORD)
            ]
          ],
        confirmPassword:
          [
            null,
            [
              Validators.required,
              this.matchPasswordValidator('password')
            ]
          ]
      }
    );
  }


  onSubmit() {
    this.accountService.register(this.registerForm.value)
      .pipe(
        tap(() => {
          this.router.navigateByUrl('/shop');
        }),
        catchError((error) => {
          this.errors = error.errors;
          console.error(error);
          return EMPTY; // Use EMPTY, which is an observable that does nothing (doesn't emit values) and completes immediately.
        })
      )
      .subscribe();
  }


  /**
   * Asynchronous validator function for checking if an email address is already taken.
   * This validator uses a cache to avoid redundant API calls.
   *
   * @returns {AsyncValidatorFn} - An asynchronous validator function that returns an Observable.
   *
   * @example
   * // Usage in Angular Form
   * this.form = this.fb.group({
   *   email: ['', [], [this.validateEmailNotTaken()]]
   * });
   *
   * @see {@link https://angular.io/api/forms/AsyncValidatorFn} for more info on AsyncValidatorFn
   * @see {@link https://angular.io/api/forms/ValidationErrors} for more info on ValidationErrors
   */
  validateEmailNotTaken(): AsyncValidatorFn {
    // Ensure the email cache is initialized if it doesn't exist.
    this.emailCache = this.emailCache || {};

    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // If the control has no value, it's not an error in the context of this validator.
      if (!control.value) {
        return of(null);
      }

      // Check if the email is in the cache to avoid redundant API calls.
      if (this.emailCache.hasOwnProperty(control.value)) {
        const cacheResult = this.emailCache[control.value];
        return of(cacheResult ? { [errorType.EMAIL_EXISTS]: true } : null);
      }

      // Perform the asynchronous validation after a 500ms delay.
      return timer(500).pipe(
        // Proceed only if the control still has a value (it wasn't cleared during the delay).
        filter(() => !!control.value),
        // Call the service to check if the email exists.
        switchMap(() => this.accountService.checkEmailExists(control.value)),
        // Cache the result and return either a validation error object or null.
        map(res => {
          this.emailCache[control.value] = res;
          return res ? { [errorType.EMAIL_EXISTS]: true } : null;
        }),
        // Handle any errors that occur during validation.
        catchError(error => {
          console.error('Validation failed:', error);
          return of({ [errorType.UNKNOWN_ERROR]: true });
        })
      );
    };
  }


  /**
 * Custom validator function for matching two form controls.
 *
 * @param {string} matchTo - The name of the control to match against.
 * @param {boolean} [reverse] - Optional flag to indicate reverse validation.
 *                               When set to true, the validator will also trigger re-validation
 *                               of the control specified in `matchTo` whenever the current control changes.
 * @returns {ValidatorFn} - A validator function that takes an AbstractControl and returns
 *                          either null if the controls match, or an error object if they don't.
 *
 * @example
 * // Usage in Angular Form
 * this.form = this.fb.group({
 *   password: ['', [this.matchPasswordValidator('confirmPassword', true)]],
 *   confirmPassword: ['', [this.matchPasswordValidator('password')]]
 * });
 *
 * @see {@link https://angular.io/api/forms/ValidatorFn} for more info on ValidatorFn
 * @see {@link https://angular.io/api/forms/ValidationErrors} for more info on ValidationErrors
 */
  matchPasswordValidator(matchTo: string, reverse?: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Retrieve parent controls from the current control's parent form or form group
      const parentControls = control.parent?.controls as { [key: string]: AbstractControl } | null;

      // If reverse flag is true, trigger re-validation of the control specified in `matchTo`
      if (control.parent && reverse) {
        const confirmControl = parentControls ? parentControls[matchTo] : null;
        if (confirmControl) {
          confirmControl.updateValueAndValidity();
        }
        return null;
      }

      // Return error if parent form or values are not available
      if (!control.parent || !control.parent.value || !parentControls) {
        return { [errorType.MATCHING]: true };
      }

      // Retrieve the control to match against
      const matchControl = parentControls[matchTo];

      // Check if both controls' values match
      const isMatching = matchControl ? control.value === matchControl.value : false;

      // Return null if they match, or an error object if they don't
      return isMatching ? null : { [errorType.MATCHING]: true };
    };
  }
}
