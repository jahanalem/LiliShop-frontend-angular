import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CheckoutDeliveryComponent } from './checkout-delivery.component';
import { CheckoutData } from '../checkout.component';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { AccountService } from 'src/app/core/services/account.service';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { of } from 'rxjs';

describe('CheckoutDeliveryComponent', () => {
    let component: CheckoutDeliveryComponent;
    let fixture: ComponentFixture<CheckoutDeliveryComponent>;
    let mockCheckoutService: MockedObject<CheckoutService>;
    let mockBasketService: MockedObject<BasketService>;

    beforeEach(async () => {
        mockCheckoutService = {
            getDeliveryMethods: vi.fn().mockName("CheckoutService.getDeliveryMethods")
        } as unknown as MockedObject<CheckoutService>;
        mockBasketService = {
            setShippingPrice: vi.fn().mockName("BasketService.setShippingPrice")
        } as unknown as MockedObject<BasketService>;
        const mockAccountService = {
            isLoggedIn: vi.fn().mockName("AccountService.isLoggedIn").mockReturnValue(true)
        };

        const testDeliveryMethods: IDeliveryMethod[] = [
            { id: 1, shortName: 'Standard', deliveryTime: '3-5 Days', description: 'Standard Delivery', price: 5 },
            { id: 2, shortName: 'Express', deliveryTime: '1-2 Days', description: 'Express Delivery', price: 10 }
        ];
        mockCheckoutService.getDeliveryMethods.mockReturnValue(of(testDeliveryMethods));

        await TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                CheckoutDeliveryComponent
            ],
            providers: [
                provideRouter([]),
                { provide: CheckoutService, useValue: mockCheckoutService },
                { provide: BasketService, useValue: mockBasketService },
                { provide: AccountService, useValue: mockAccountService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CheckoutDeliveryComponent);
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

    it('should fetch delivery methods on init', () => {
        const testDeliveryMethods: IDeliveryMethod[] = [
            { id: 1, shortName: 'Standard', deliveryTime: '3-5 Days', description: 'Standard Delivery', price: 5 },
            { id: 2, shortName: 'Express', deliveryTime: '1-2 Days', description: 'Express Delivery', price: 10 }
        ];
        mockCheckoutService.getDeliveryMethods.mockReturnValue(of(testDeliveryMethods));

        component.ngOnInit();

        expect(mockCheckoutService.getDeliveryMethods).toHaveBeenCalled();
        expect(component.deliveryMethods()).toEqual(testDeliveryMethods);
    });

    it('should set shipping price', () => {
        const testDeliveryMethod: IDeliveryMethod = { id: 1, shortName: 'Standard', deliveryTime: '3-5 Days', description: 'Standard Delivery', price: 5 };

        component.setShippingPrice(testDeliveryMethod);

        expect(mockBasketService.setShippingPrice).toHaveBeenCalledWith(testDeliveryMethod);
    });
});
