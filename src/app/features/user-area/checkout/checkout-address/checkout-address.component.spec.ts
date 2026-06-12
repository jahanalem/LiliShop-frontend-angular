import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { of, throwError } from 'rxjs';
import { IAddress } from 'src/app/shared/models/address';
import { AccountService } from 'src/app/core/services/account.service';
import { CheckoutAddressComponent } from './checkout-address.component';
import { CheckoutData } from '../checkout.component';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CdkStepper } from '@angular/cdk/stepper';


describe('CheckoutAddressComponent', () => {
    let component: CheckoutAddressComponent;
    let fixture: ComponentFixture<CheckoutAddressComponent>;
    let mockAccountService: MockedObject<AccountService>;

    beforeEach(async () => {
        mockAccountService = {
            updateAddress: vi.fn().mockName("AccountService.updateAddress")
        } as unknown as MockedObject<AccountService>;

        await TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                CheckoutAddressComponent
            ],
            providers: [
                provideRouter([]),
                { provide: AccountService, useValue: mockAccountService },
                // Template uses cdkStepperNext/Previous, which inject CdkStepper from DI.
                { provide: CdkStepper, useValue: { next: vi.fn(), previous: vi.fn() } }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CheckoutAddressComponent);
        component = fixture.componentInstance;

        const checkoutModel = signal<CheckoutData>({
            address: { firstName: '', lastName: '', street: '', city: '', state: '', zipCode: '' },
            delivery: { deliveryMethod: null },
            payment: { nameOnCard: '' },
        });
        const checkoutForm = TestBed.runInInjectionContext(() => form(checkoutModel));
        fixture.componentRef.setInput('checkoutForm', checkoutForm);
        fixture.detectChanges();
    });


    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should save user address on success', () => {
        const testAddress: IAddress = {
            firstName: 'John',
            lastName: 'Doe',
            street: '123 Main St.',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345'
        }; // mock an IAddress object
        const component = fixture.debugElement.children[0].componentInstance as CheckoutAddressComponent;
        mockAccountService.updateAddress.mockReturnValue(of(testAddress));

        component.saveUserAddress();

        expect(mockAccountService.updateAddress).toHaveBeenCalled();
    });

    it('should show error message on updateAddress error', () => {
        const testError = { message: 'Error updating address.' };
        const component = fixture.debugElement.children[0].componentInstance as CheckoutAddressComponent;
        mockAccountService.updateAddress.mockReturnValue(throwError(() => testError));

        component.saveUserAddress();

        expect(mockAccountService.updateAddress).toHaveBeenCalled();
    });
});
