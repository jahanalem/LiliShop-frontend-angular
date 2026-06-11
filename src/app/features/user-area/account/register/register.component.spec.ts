import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock, MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AccountService } from 'src/app/core/services/account.service';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';


describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let accountService: AccountService;
    let router: MockedObject<Router>;

    beforeEach(async () => {
        const accountServiceSpy = {
            register: vi.fn().mockName("AccountService.register"),
            checkEmailExists: vi.fn().mockName("AccountService.checkEmailExists").mockReturnValue(of(false))
        };
        const routerSpy = {
            navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
        };
        const dialogSpy = {
            open: vi.fn().mockName("MatDialog.open").mockReturnValue({ afterClosed: () => of(true) })
        };

        await TestBed.configureTestingModule({
            imports: [FormsModule, ReactiveFormsModule, RegisterComponent, TextInputComponent],
            providers: [
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: dialogSpy },
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

    const validFormData = {
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
    };

    it('should call accountService.register() and navigate to /shop on successful registration', async () => {
        vi.useFakeTimers();
        try {
            component.registerModel.set(validFormData);

            // The HTTP response shape the component reads (response?.headers.get(...)).
            (accountService.register as Mock).mockReturnValue(of({ headers: { get: () => null } }));

            component.onSubmit();
            // Flush the 500ms debounced async email validator and the submit pipeline.
            await vi.runAllTimersAsync();

            expect(accountService.register).toHaveBeenCalled();
            expect(router.navigateByUrl).toHaveBeenCalledWith('/shop');
        } finally {
            vi.useRealTimers();
        }
    });

    it('should display error messages on failed registration', async () => {
        vi.useFakeTimers();
        try {
            component.registerModel.set(validFormData);
            const errorResponse = { errors: ['Error 1', 'Error 2'] };

            (accountService.register as Mock).mockReturnValue(throwError(() => errorResponse));

            component.onSubmit();
            await vi.runAllTimersAsync();

            expect(accountService.register).toHaveBeenCalled();
            expect(component.errors()).toEqual(errorResponse.errors);
        } finally {
            vi.useRealTimers();
        }
    });
});
