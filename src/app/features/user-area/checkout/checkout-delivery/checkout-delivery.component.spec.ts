import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { CheckoutDeliveryComponent } from './checkout-delivery.component';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { of } from 'rxjs';

describe('CheckoutDeliveryComponent', () => {
  let component: CheckoutDeliveryComponent;
  let fixture: ComponentFixture<CheckoutDeliveryComponent>;
  let mockCheckoutService: jasmine.SpyObj<CheckoutService>;
  let mockBasketService: jasmine.SpyObj<BasketService>;

  beforeEach(() => {
    mockCheckoutService = jasmine.createSpyObj('CheckoutService', ['getDeliveryMethods']);
    mockBasketService = jasmine.createSpyObj('BasketService', ['setShippingPrice']);

    const testDeliveryMethods: IDeliveryMethod[] = [
      { id: 1, shortName: 'Standard', deliveryTime: '3-5 Days', description: 'Standard Delivery', price: 5 },
      { id: 2, shortName: 'Express', deliveryTime: '1-2 Days', description: 'Express Delivery', price: 10 }
    ];
    mockCheckoutService.getDeliveryMethods.and.returnValue(of(testDeliveryMethods));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        ReactiveFormsModule
      ],
      declarations: [CheckoutDeliveryComponent],
      providers: [
        { provide: CheckoutService, useValue: mockCheckoutService },
        { provide: BasketService, useValue: mockBasketService }
      ]
    });

    fixture = TestBed.createComponent(CheckoutDeliveryComponent);
    component = fixture.componentInstance;
    component.checkoutForm = new FormGroup({
      deliveryForm: new FormGroup({
        deliveryMethod: new FormControl('', Validators.required)
      })
    });
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
    mockCheckoutService.getDeliveryMethods.and.returnValue(of(testDeliveryMethods));

    const component = fixture.debugElement.children[0].componentInstance as CheckoutDeliveryComponent;
    component.ngOnInit();

    expect(mockCheckoutService.getDeliveryMethods).toHaveBeenCalled();
    expect(component.deliveryMethods).toEqual(testDeliveryMethods);
  });

  it('should set shipping price', () => {
    const testDeliveryMethod: IDeliveryMethod = { id: 1, shortName: 'Standard', deliveryTime: '3-5 Days', description: 'Standard Delivery', price: 5 };

    const component = fixture.debugElement.children[0].componentInstance as CheckoutDeliveryComponent;
    component.setShippingPrice(testDeliveryMethod);

    expect(mockBasketService.setShippingPrice).toHaveBeenCalledWith(testDeliveryMethod);
  });
});
