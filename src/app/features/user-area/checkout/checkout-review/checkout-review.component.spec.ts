import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkStepper } from '@angular/cdk/stepper';
import { of, throwError } from 'rxjs';
import { CheckoutReviewComponent } from './checkout-review.component';
import { BasketService } from 'src/app/core/services/basket.service';
import { IBasket } from 'src/app/shared/models/basket';

describe('CheckoutReviewComponent', () => {
  let component: CheckoutReviewComponent;
  let fixture: ComponentFixture<CheckoutReviewComponent>;
  let mockBasketService: jasmine.SpyObj<BasketService>;
  let stepper: jasmine.SpyObj<CdkStepper>;

  beforeEach(async () => {
    mockBasketService = jasmine.createSpyObj('BasketService', ['createPaymentIntent']);
    stepper = jasmine.createSpyObj('CdkStepper', ['next']);

    await TestBed.configureTestingModule({
      declarations: [CheckoutReviewComponent],
      providers: [
        { provide: BasketService, useValue: mockBasketService },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutReviewComponent);
    component = fixture.componentInstance;
    component.appStepper = stepper;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize basket$ on ngOnInit', () => {
    component.ngOnInit();
    expect(component.basket$).toBe(mockBasketService.basket$);
  });

  it('should call createPaymentIntent and stepper.next() on success', () => {
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

    mockBasketService.createPaymentIntent.and.returnValue(of(dummyBasket));
    component.createPaymentIntent();

    expect(mockBasketService.createPaymentIntent).toHaveBeenCalled();
    expect(stepper.next).toHaveBeenCalled();
  });

  it('should handle error in createPaymentIntent', () => {
    const consoleSpy = spyOn(console, 'log');
    const error = { message: 'Error creating payment intent.' };
    mockBasketService.createPaymentIntent.and.returnValue(throwError(() => error));

    component.createPaymentIntent();

    expect(mockBasketService.createPaymentIntent).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });
});
