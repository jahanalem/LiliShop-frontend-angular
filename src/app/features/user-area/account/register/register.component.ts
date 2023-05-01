import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, timer, map, of, catchError, throwError } from 'rxjs';
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
    this.accountService
      .register(this.registerForm.value)
      .pipe(
        catchError((error) => {
          this.errors = error.errors;
          return throwError(error);
        })
      )
      .subscribe(
        (_response) => {
          this.router.navigateByUrl('/shop');
        },
        (error) => {console.log(error); }
      );
  }

  validateEmailNotTaken(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return timer(500).pipe(
        switchMap(() => {
          if (!control.value) {
            return of(null);
          }
          return this.accountService.checkEmailExists(control.value).pipe(
            map(res => {
              return res ? { [errorType.EMAIL_EXISTS]: true } : null;
            })
          );
        })
      )
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
