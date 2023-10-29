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

  // it('should create and mount Stripe elements after view initialization', () => {
  //   const fakeStripeElement = {
  //     mount: jasmine.createSpy('mount'),
  //     on: jasmine.createSpy('on'),
  //     once: jasmine.createSpy('once'),
  //     off: jasmine.createSpy('off'),
  //     update: jasmine.createSpy('update'),
  //     blur: jasmine.createSpy('blur'),
  //     clear: jasmine.createSpy('clear'),
  //     destroy: jasmine.createSpy('destroy'),
  //     focus: jasmine.createSpy('focus'),
  //     unmount: jasmine.createSpy('unmount'),
  //   };

  //   const mockElements = component.stripe.elements();
  //   spyOn(mockElements, 'create').and.returnValue(fakeStripeElement);
  //   spyOn(component.stripe, 'elements').and.returnValue(mockElements);

  //   component.ngAfterViewInit();

  //   expect(mockElements.create).toHaveBeenCalledTimes(3);
  //   expect(mockElements.create).toHaveBeenCalledWith('cardNumber' as any, jasmine.any(Object));
  //   expect(mockElements.create).toHaveBeenCalledWith('cardExpiry' as any, jasmine.any(Object));
  //   expect(mockElements.create).toHaveBeenCalledWith('cardCvc' as any, jasmine.any(Object));
  //   expect(component.cardNumber).toBeDefined();
  //   expect(component.cardExpiry).toBeDefined();
  //   expect(component.cardCvc).toBeDefined();
  // });

  it('should show an error when the card is invalid', () => {
    const cardError = { error: { message: 'Invalid card' }, elementType: 'cardNumber', complete: false };
    component.onChange(cardError);

    expect(component.cardErrors).toEqual('Invalid card');
    expect(component.cardNumberValid).toBe(false);
  });

  it('should not execute submitOrder() when there is no basket value', async () => {
    mockBasketService.getCurrentBasketValue.and.returnValue(null);
    spyOn(component, 'createOrder');
    spyOn(component, 'confirmPaymentWithStripe');

    await component.submitOrder();

    expect(component.createOrder).not.toHaveBeenCalled();
    expect(component.confirmPaymentWithStripe).not.toHaveBeenCalled();
  });

  it('should display an error message when the client secret is missing', async () => {
    const mockBasket: IBasket = {
      id: 'testBasketId',
      items: [],
      clientSecret: undefined,
    };
    mockBasketService.getCurrentBasketValue.and.returnValue(mockBasket);
    spyOn(component.toastr, 'error');

    try {
      await component.confirmPaymentWithStripe(mockBasket);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual('Client secret is missing');
        expect(component.toastr.error).toHaveBeenCalledWith('Client secret is missing');
      } else {
        console.error(`Unknown error occurred: ${error}`);
      }
    }
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
