import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
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
            login: vi.fn().mockName("AccountService.login"),
            // Same contract as the real service: only a response with a real token and no
            // pending two-factor step counts as an authenticated login.
            isAuthenticatedUser: (user: IUser | null | undefined) =>
                !!user && !!user.token && !user.requiresTwoFactorSetup && !user.requiresTwoFactorCode
        };
        const routerMock = {
            navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
        };
        const authorizationServiceMock = {
            isCurrentUserAuthorized: vi.fn().mockName("AuthorizationService.isCurrentUserAuthorized").mockReturnValue(of(false))
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
                { provide: AuthorizationService, useValue: authorizationServiceMock },
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
        expect(component.loginForm.email).toBeTruthy();
        expect(component.loginForm.password).toBeTruthy();
    });

    it('should have invalid form on init', () => {
        expect(component.loginForm().invalid()).toBe(true);
    });

    it('should call onSubmit and navigate to returnUrl when login is successful', () => {
        (accountService.login as Mock).mockReturnValue(of({ token: 'jwt' } as IUser));
        const navigateSpy = (component['router'].navigateByUrl as Mock);

        component.loginForm.email().value.set('test@example.com');
        component.loginForm.password().value.set('password');
        component.onSubmit();

        expect(accountService.login).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith(component.returnUrl());
    });

    it('should call onSubmit and show a server error when login fails', () => {
        (accountService.login as Mock).mockReturnValue(throwError(() => 'Login failed'));

        component.loginForm.email().value.set('test@example.com');
        component.loginForm.password().value.set('password');
        component.onSubmit();

        expect(accountService.login).toHaveBeenCalled();
        expect(component.serverError()).toBeTruthy();
        expect(component.stage()).toBe('credentials');
    });

    it('should enter the MFA setup stage when the backend requires enrollment', () => {
        (accountService.login as Mock).mockReturnValue(
            of({ token: '', requiresTwoFactorSetup: true } as IUser));

        component.loginForm.email().value.set('admin@example.com');
        component.loginForm.password().value.set('password');
        component.onSubmit();

        expect(component.stage()).toBe('setup');
        expect(component.credentials()).toEqual({ email: 'admin@example.com', password: 'password' });
    });

    it('should enter the MFA verify stage when the backend requires a code', () => {
        (accountService.login as Mock).mockReturnValue(
            of({ token: '', requiresTwoFactorCode: true } as IUser));

        component.loginForm.email().value.set('admin@example.com');
        component.loginForm.password().value.set('password');
        component.onSubmit();

        expect(component.stage()).toBe('verify');
    });

    it('should discard credentials and return to the credentials stage on MFA cancel', () => {
        (accountService.login as Mock).mockReturnValue(
            of({ token: '', requiresTwoFactorCode: true } as IUser));

        component.loginForm.email().value.set('admin@example.com');
        component.loginForm.password().value.set('password');
        component.onSubmit();
        component.onCancelMfa();

        expect(component.stage()).toBe('credentials');
        expect(component.credentials()).toEqual({ email: '', password: '' });
    });

    it('should not call onSubmit when form is invalid', () => {
        (accountService.login as Mock).mockReturnValue(of({} as IUser));

        // Set email to an empty string to make the form invalid
        component.loginForm.email().value.set('');

        component.onSubmit();

        expect(accountService.login).not.toHaveBeenCalled();
    });

    it('should have invalid email field initially', () => {
        const emailControl = component.loginForm.email;
        expect(emailControl().valid()).toBe(false);
    });

    it('should have valid email field after providing valid email', () => {
        const emailControl = component.loginForm.email;
        emailControl().value.set('test@example.com');
        expect(emailControl().valid()).toBe(true);
    });

    it('should have invalid email field after providing invalid email', () => {
        const emailControl = component.loginForm.email;
        emailControl().value.set('invalid_email');
        expect(emailControl().valid()).toBe(false);
    });

    it('should have invalid password field initially', () => {
        const passwordControl = component.loginForm.password;
        expect(passwordControl().valid()).toBe(false);
    });

    it('should have valid password field after providing password', () => {
        const passwordControl = component.loginForm.password;
        passwordControl().value.set('password');
        expect(passwordControl().valid()).toBe(true);
    });

});
