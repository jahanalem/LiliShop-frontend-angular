import type { Mock } from "vitest";
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
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';


describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let accountService: AccountService;

    beforeEach(async () => {
        const accountServiceMock = {
            login: vi.fn().mockName("AccountService.login")
        };
        const routerMock = {
            navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
        };
        const activatedRouteMock = {
            snapshot: {
                queryParams: {
                    returnUrl: '/'
                }
            }
        };
        await TestBed.configureTestingModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [ReactiveFormsModule,
        RouterTestingModule, LoginComponent, TextInputComponent],
    providers: [FormBuilder,
        { provide: AccountService, useValue: accountServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }, provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        accountService = TestBed.inject(AccountService);
        fixture.detectChanges();
    });

    afterEach(() => {
        (accountService.login as Mock).mockClear();
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
        expect(component.loginForm.invalid).toBe(true);
    });

    it('should call onSubmit and navigate to returnUrl when login is successful', () => {
        (accountService.login as Mock).mockReturnValue(of({} as IUser));
        const navigateSpy = (component['router'].navigateByUrl as Mock);

        component.loginForm.controls['email'].setValue('test@example.com');
        component.loginForm.controls['password'].setValue('password');
        component.onSubmit();

        expect(accountService.login).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith(component.returnUrl);
    });

    it('should call onSubmit and log an error when login fails', () => {
        (accountService.login as Mock).mockReturnValue(throwError(() => 'Login failed'));
        const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined);

        component.loginForm.controls['email'].setValue('test@example.com');
        component.loginForm.controls['password'].setValue('password');
        component.onSubmit();

        expect(accountService.login).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Submit failed!');
    });

    it('should not call onSubmit when form is invalid', () => {
        (accountService.login as Mock).mockReturnValue(of({} as IUser));

        // Set email to an empty string to make the form invalid
        component.loginForm.controls['email'].setValue('');

        component.onSubmit();

        expect(accountService.login).not.toHaveBeenCalled();
    });

    it('should have invalid email field initially', () => {
        const emailControl = component.loginForm.controls['email'];
        expect(emailControl.valid).toBe(false);
    });

    it('should have valid email field after providing valid email', () => {
        const emailControl = component.loginForm.controls['email'];
        emailControl.setValue('test@example.com');
        expect(emailControl.valid).toBe(true);
    });

    it('should have invalid email field after providing invalid email', () => {
        const emailControl = component.loginForm.controls['email'];
        emailControl.setValue('invalid_email');
        expect(emailControl.valid).toBe(false);
    });

    it('should have invalid password field initially', () => {
        const passwordControl = component.loginForm.controls['password'];
        expect(passwordControl.valid).toBe(false);
    });

    it('should have valid password field after providing password', () => {
        const passwordControl = component.loginForm.controls['password'];
        passwordControl.setValue('password');
        expect(passwordControl.valid).toBe(true);
    });

});
