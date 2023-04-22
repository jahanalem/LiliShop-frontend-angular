import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AccountService } from './core/services/account.service';
import { BasketService } from './core/services/basket.service';
import { of, throwError } from 'rxjs';
import { IBasket } from './shared/models/basket';
import { IUser } from './shared/models/user';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let basketServiceSpy: jasmine.SpyObj<BasketService>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;

  beforeEach(async () => {
    const basketServiceMock = jasmine.createSpyObj('BasketService', ['getBasket']);
    const accountServiceMock = jasmine.createSpyObj('AccountService', ['loadCurrentUser']);

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        { provide: BasketService, useValue: basketServiceMock },
        { provide: AccountService, useValue: accountServiceMock },
      ],
    }).compileComponents();

    basketServiceSpy = TestBed.inject(BasketService) as jasmine.SpyObj<BasketService>;
    accountServiceSpy = TestBed.inject(AccountService) as jasmine.SpyObj<AccountService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    component.isTesting = true;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should load basket if basket_id exists in local storage', () => {
    spyOn(localStorage, 'getItem').and.callFake(() => 'test_basket_id');
    basketServiceSpy.getBasket.and.returnValue(of({ id: 'test_basket_id', items: [] } as IBasket));

    component.loadBasket();

    expect(basketServiceSpy.getBasket).toHaveBeenCalledWith('test_basket_id');
  });

  it('should not load basket if basket_id does not exist in local storage', () => {
    spyOn(localStorage, 'getItem').and.callFake(() => null);

    component.loadBasket();

    expect(basketServiceSpy.getBasket).not.toHaveBeenCalled();
  });

  it('should load current user if token exists in local storage', () => {
    spyOn(localStorage, 'getItem').and.callFake(() => 'test_token');
    accountServiceSpy.loadCurrentUser.and.returnValue(of({ email: 'test@test.com', displayName: 'Test User', role: 'User', token: 'test_token' } as IUser));

    component.loadCurrentUser();

    expect(accountServiceSpy.loadCurrentUser).toHaveBeenCalledWith('test_token');
  });

  it('should not load current user if token does not exist in local storage', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    accountServiceSpy.loadCurrentUser.and.returnValue(of(null));

    component.loadCurrentUser();

    expect(accountServiceSpy.loadCurrentUser).not.toHaveBeenCalled();
  });

  it('should handle basketService errors gracefully', () => {
    spyOn(localStorage, 'getItem').and.callFake(() => 'test_basket_id');
    spyOn(console, 'log');
    basketServiceSpy.getBasket.and.returnValue(throwError(() => 'Error'));

    component.loadBasket();

    expect(console.log).toHaveBeenCalled();
  });

  it('should handle accountService errors gracefully', () => {
    spyOn(localStorage, 'getItem').and.callFake(() => 'test_token');
    spyOn(console, 'log');
    accountServiceSpy.loadCurrentUser.and.returnValue(throwError(() => 'Error'));

    component.loadCurrentUser();

    expect(console.log).toHaveBeenCalled();
  });
});
