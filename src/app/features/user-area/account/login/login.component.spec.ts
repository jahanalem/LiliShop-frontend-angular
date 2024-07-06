import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AccountService } from 'src/app/core/services/account.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { IUser } from 'src/app/shared/models/user';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';


describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let accountService: AccountService;

  beforeEach(async () => {
    const accountServiceMock = jasmine.createSpyObj('AccountService', ['login']);
    const routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const activatedRouteMock = {
      snapshot: {
        queryParams: {
          returnUrl: '/'
        }
      }
    };
    await TestBed.configureTestingModule({
    declarations: [LoginComponent, TextInputComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [ReactiveFormsModule,
        RouterTestingModule],
    providers: [FormBuilder,
        { provide: AccountService, useValue: accountServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    accountService = TestBed.inject(AccountService);
    fixture.detectChanges();
  });

  afterEach(() => {
    (accountService.login as jasmine.Spy).calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create login form', () => {
    expect(component.loginForm).toBeTruthy();
    expect(component.loginForm.controls['email']).toBeTruthy();
    expect(component.loginForm.controls['password']).toBeTruthy();
  });

  it('should have invalid form on init', () => {
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should call onSubmit and navigate to returnUrl when login is successful', () => {
    (accountService.login as jasmine.Spy).and.returnValue(of({} as IUser));
    const navigateSpy = (component['router'].navigateByUrl as jasmine.Spy);

    component.loginForm.controls['email'].setValue('test@example.com');
    component.loginForm.controls['password'].setValue('password');
    component.onSubmit();

    expect(accountService.login).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(component.returnUrl);
  });

  it('should call onSubmit and log an error when login fails', () => {
    (accountService.login as jasmine.Spy).and.returnValue(throwError(() => 'Login failed'));
    const consoleSpy = spyOn(console, 'log');

    component.loginForm.controls['email'].setValue('test@example.com');
    component.loginForm.controls['password'].setValue('password');
    component.onSubmit();

    expect(accountService.login).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Submit failed!');
  });

  it('should not call onSubmit when form is invalid', () => {
    (accountService.login as jasmine.Spy).and.returnValue(of({} as IUser));

    // Set email to an empty string to make the form invalid
    component.loginForm.controls['email'].setValue('');

    component.onSubmit();

    expect(accountService.login).not.toHaveBeenCalled();
  });

  it('should have invalid email field initially', () => {
    const emailControl = component.loginForm.controls['email'];
    expect(emailControl.valid).toBeFalse();
  });

  it('should have valid email field after providing valid email', () => {
    const emailControl = component.loginForm.controls['email'];
    emailControl.setValue('test@example.com');
    expect(emailControl.valid).toBeTrue();
  });

  it('should have invalid email field after providing invalid email', () => {
    const emailControl = component.loginForm.controls['email'];
    emailControl.setValue('invalid_email');
    expect(emailControl.valid).toBeFalse();
  });

  it('should have invalid password field initially', () => {
    const passwordControl = component.loginForm.controls['password'];
    expect(passwordControl.valid).toBeFalse();
  });

  it('should have valid password field after providing password', () => {
    const passwordControl = component.loginForm.controls['password'];
    passwordControl.setValue('password');
    expect(passwordControl.valid).toBeTrue();
  });

});
