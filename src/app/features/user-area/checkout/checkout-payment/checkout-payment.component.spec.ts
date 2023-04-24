import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { CheckoutPaymentComponent } from './checkout-payment.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { BasketService } from 'src/app/core/services/basket.service';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { of } from 'rxjs';
import { IBasket } from 'src/app/shared/models/basket';
import { IOrder } from 'src/app/shared/models/order';
import { PaymentIntentResult } from '@stripe/stripe-js';
import { Component } from '@angular/core';

describe('CheckoutPaymentComponent', () => {
  let component: CheckoutPaymentComponent;
  let fixture: ComponentFixture<CheckoutPaymentComponent>;
  let mockBasketService: jasmine.SpyObj<BasketService>;
  let mockCheckoutService: jasmine.SpyObj<CheckoutService>;

  beforeEach(async () => {
    mockBasketService = jasmine.createSpyObj('BasketService', ['getCurrentBasketValue', 'deleteBasket']);
    mockCheckoutService = jasmine.createSpyObj('CheckoutService', ['createOrder']);

    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        ToastrModule.forRoot(),
        RouterTestingModule.withRoutes([
          { path: 'checkout/success', component: DummyComponent },
        ]),
      ],
      declarations: [CheckoutPaymentComponent, TextInputComponent],
      providers: [
        { provide: BasketService, useValue: mockBasketService },
        { provide: CheckoutService, useValue: mockCheckoutService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutPaymentComponent);
    component = fixture.componentInstance;
    component.checkoutForm = new FormGroup({
      paymentForm: new FormGroup({
        nameOnCard: new FormControl('', Validators.required)
      })
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit the order successfully', async () => {
    const mockBasket: IBasket = {
      id: 'testBasketId',
      items: [],
      clientSecret: 'testClientSecret',
    };
    mockBasketService.getCurrentBasketValue.and.returnValue(mockBasket);

    mockBasketService.deleteBasket.and.returnValue(of(undefined));

    const mockOrder: IOrder = {
      id: 1,
      buyerEmail: 'test@example.com',
      orderDate: new Date().toISOString(),
      shipToAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St.',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
      },
      deliveryMethod: 'Standard',
      shippingPrice: 10,
      orderItems: [],
      subtotal: 100,
      total: 110,
      status: 'Pending',
    };
    mockCheckoutService.createOrder.and.returnValue(of(mockOrder));

    const mockPaymentIntentResult: PaymentIntentResult = {
      paymentIntent: {
        id: 'testPaymentIntentId',
        object: 'payment_intent',
        amount: 10000,
        canceled_at: null,
        cancellation_reason: null,
        capture_method: 'automatic',
        client_secret: 'testClientSecret',
        confirmation_method: 'automatic',
        created: 1234567890,
        currency: 'usd',
        description: '',
        livemode: false,
        last_payment_error: null,
        next_action: null,
        payment_method: 'testPaymentMethodId',
        payment_method_types: ['card'],
        receipt_email: null,
        setup_future_usage: null,
        shipping: null,
        status: 'succeeded',
      },
      error: undefined,
    };

    spyOn(component.stripe, 'confirmCardPayment').and.returnValue(Promise.resolve(mockPaymentIntentResult));

    await component.submitOrder();

    expect(mockBasketService.deleteBasket).toHaveBeenCalled();
    expect(mockCheckoutService.createOrder).toHaveBeenCalled();
    expect(component.stripe.confirmCardPayment).toHaveBeenCalled();
  });
});

@Component({ template: '' })
class DummyComponent { }


class StripeMock {
  elements(): any {
    return {
      create: () => ({
        mount: () => { },
        unmount: () => { },
        on: () => { },
        update: () => { },
        destroy: () => { },
      }),
    };
  }

  createToken(): Promise<any> {
    return new Promise((resolve) => {
      resolve({ token: { id: 'testToken' } });
    });
  }

  createPaymentMethod(): Promise<any> {
    return new Promise((resolve) => {
      resolve({ paymentMethod: { id: 'testPaymentMethod' } });
    });
  }

  confirmCardPayment(): Promise<any> {
    return new Promise((resolve) => {
      resolve({ paymentIntent: { id: 'testPaymentIntent' } });
    });
  }
}

(window as any).Stripe = StripeMock;
