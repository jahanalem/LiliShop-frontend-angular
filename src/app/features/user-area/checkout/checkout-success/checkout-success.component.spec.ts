import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { IUser } from 'src/app/shared/models/user';
import { IOrder } from 'src/app/shared/models/order';
import { CheckoutSuccessComponent } from './checkout-success.component';

describe('CheckoutSuccessComponent', () => {
  let component: CheckoutSuccessComponent;
  let fixture: ComponentFixture<CheckoutSuccessComponent>;
  let mockAccountService: jasmine.SpyObj<AccountService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    mockAccountService = jasmine.createSpyObj('AccountService', [], { currentUser$: of<IUser | null>(null) });
    mockRouter = jasmine.createSpyObj('Router', ['getCurrentNavigation']);

    TestBed.configureTestingModule({
      declarations: [CheckoutSuccessComponent],
      providers: [
        { provide: AccountService, useValue: mockAccountService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with order data from router navigation state', () => {
    const testOrder: IOrder = {
      id: 1,
      orderDate: '24.04.2023',
      orderItems: [],
      shippingPrice: 10,
      subtotal: 100,
      total: 110,
      status: 'Pending',
      deliveryMethod: 'Standard',
      shipToAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St.',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      },
      buyerEmail: 's.r.alem@xxx.com'
    };

    mockRouter.getCurrentNavigation.and.returnValue({
      extras: { state: { order: testOrder } }
    } as any);

    component.initializeOrderFromNavigationState(mockRouter.getCurrentNavigation());
    expect(component.order).toEqual(testOrder);
  });
});
