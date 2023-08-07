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

  constructor(private fb: FormBuilder, private accountService: AccountService, private router: Router) { }

  ngOnInit(): void {
    this.createRegisterForm();
  }


  createRegisterForm() {
    this.registerForm = this.fb.group(
      {
        displayName: [null, Validators.required],
        email:
          [
            null,
            [Validators.required, Validators.pattern(pattern.EMAIL)],
            [this.validateEmailNotTaken()]
          ],
        password: [null,
          [
            Validators.required,
            this.matchPasswordValidator('confirmPassword', true),
            Validators.pattern(pattern.PASSWORD)
          ]],
        confirmPassword: [null, [Validators.required, this.matchPasswordValidator('password')]]
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


  validateEmailNotTaken(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(500).pipe(
        filter(() => !!control.value),
        switchMap(() => this.accountService.checkEmailExists(control.value)),
        map(res => res ? { [errorType.EMAIL_EXISTS]: true } : null)
      );
    }
  }


  matchPasswordValidator(matchTo: string, reverse?: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.parent && reverse) {
        const confirmControl = (control.parent?.controls as any)[matchTo] as AbstractControl;
        if (confirmControl) {
          confirmControl.updateValueAndValidity();
        }
        return null;
      }
      return !!control.parent && !!control.parent.value &&
        control.value === (control.parent?.controls as any)[matchTo].value ? null : { [errorType.MATCHING]: true };
    };
  }
}
