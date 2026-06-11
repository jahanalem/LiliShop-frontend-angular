import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock, MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AccountService } from 'src/app/core/services/account.service';
import { IUser } from 'src/app/shared/models/user';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';


describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let accountService: AccountService;
    let router: MockedObject<Router>;

    beforeEach(async () => {
        const accountServiceSpy = {
            register: vi.fn().mockName("AccountService.register"),
            checkEmailExists: vi.fn().mockName("AccountService.checkEmailExists")
        };
        const routerSpy = {
            navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
        };

        await TestBed.configureTestingModule({
            imports: [FormsModule, ReactiveFormsModule, RegisterComponent, TextInputComponent],
            providers: [
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        accountService = TestBed.inject(AccountService) as MockedObject<AccountService>;
        router = TestBed.inject(Router) as MockedObject<Router>;
        fixture.detectChanges();
    });


    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the registerForm', () => {
        component.ngOnInit();
        expect(component.registerForm).toBeDefined();
        expect(component.registerForm()).toBeTruthy();
    });

    it('should call accountService.register() and navigate to /shop on successful registration', async () => {
        component.ngOnInit();
        const formData = {
            displayName: 'John Doe',
            email: 'john.doe@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!'
        };

        component.registerModel.set(formData);

        const dummyUser: IUser = {
            email: 'john.doe@example.com',
            displayName: 'John Doe',
            role: 'user',
            token: 'dummy-token',
            emailConfirmed: false,
        };

        (accountService.register as Mock).mockReturnValue(of(dummyUser));

        component.onSubmit();

        accountService.register(formData).subscribe(() => {
            expect(accountService.register).toHaveBeenCalledWith(formData);
            expect(router.navigateByUrl).toHaveBeenCalledWith('/shop');
            ;
        });
    });

    it('should display error messages on failed registration', async () => {
        component.ngOnInit();
        const formData = {
            displayName: 'John Doe',
            email: 'john.doe@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!'
        };

        component.registerModel.set(formData);
        const errorResponse = { errors: ['Error 1', 'Error 2'] };

        (accountService.register as Mock).mockReturnValue(throwError(errorResponse));

        component.onSubmit();

        accountService.register(formData).subscribe(() => { }, (_error) => {
            expect(accountService.register).toHaveBeenCalledWith(formData);
            expect(component.errors).toEqual(errorResponse.errors);
            ;
        });
    });
});
