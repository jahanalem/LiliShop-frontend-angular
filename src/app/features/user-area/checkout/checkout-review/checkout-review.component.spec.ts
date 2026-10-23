import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkStepper } from '@angular/cdk/stepper';
import { of, throwError } from 'rxjs';
import { CheckoutReviewComponent } from './checkout-review.component';
import { BasketService } from 'src/app/core/services/basket.service';
import { AccountService } from 'src/app/core/services/account.service';
import { IBasket } from 'src/app/shared/models/basket';
import { IUser } from 'src/app/shared/models/user';

describe('CheckoutReviewComponent', () => {
    let component: CheckoutReviewComponent;
    let fixture: ComponentFixture<CheckoutReviewComponent>;
    let mockBasketService: MockedObject<BasketService>;
    let stepper: MockedObject<CdkStepper>;

    beforeEach(async () => {
        mockBasketService = {
            createPaymentIntent: vi.fn().mockName("BasketService.createPaymentIntent"),
            basket$: of(null)
        } as unknown as MockedObject<BasketService>;
        stepper = {
            next: vi.fn().mockName("CdkStepper.next")
        } as unknown as MockedObject<CdkStepper>;

        const confirmedUser: IUser = {
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'user',
            token: 'test-token',
            emailConfirmed: true
        };
        const mockAccountService = {
            getCurrentUser: vi.fn().mockName("AccountService.getCurrentUser").mockReturnValue(of(confirmedUser)),
            currentUser$: of<IUser | null>(confirmedUser)
        };

        await TestBed.configureTestingModule({
            imports: [CheckoutReviewComponent],
            providers: [
                { provide: BasketService, useValue: mockBasketService },
                { provide: AccountService, useValue: mockAccountService },
                // Template uses cdkStepperNext/Previous, which inject CdkStepper from DI.
                { provide: CdkStepper, useValue: stepper },
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CheckoutReviewComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('appStepper', stepper);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize basket on ngOnInit', () => {
        component.ngOnInit();
        expect(component.basket()).toBeNull();
    });

    it('advances to payment without creating a provider intent', () => {
        const dummyBasket: IBasket = {
            id: 'test_basket_id',
            items: [
                {
                    id: 1,
                    productName: 'Test Product',
                    price: 100,
                    quantity: 1,
                    pictureUrl: 'https://example.com/test_product.jpg',
                    brand: 'Test Brand',
                    type: 'Test Type'
                }
            ],
            clientSecret: 'test_client_secret',
            paymentIntentId: 'test_payment_intent_id',
            deliveryMethodId: 1,
            shippingPrice: 10
        };

        mockBasketService.createPaymentIntent.mockReturnValue(of(dummyBasket));
        component.createPaymentIntent();

        expect(mockBasketService.createPaymentIntent).not.toHaveBeenCalled();
        expect(stepper.next).toHaveBeenCalled();
    });

    it('never invokes the retired provider preparation even when it would fail', () => {
        mockBasketService.createPaymentIntent.mockReturnValue(throwError(() => new Error('Retired path')));
        component.createPaymentIntent();
        expect(mockBasketService.createPaymentIntent).not.toHaveBeenCalled();
        expect(stepper.next).toHaveBeenCalled();
    });
});
