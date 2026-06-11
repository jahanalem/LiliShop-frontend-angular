import { beforeEach, describe, expect, it } from "vitest";
import type { MockedObject } from "vitest";
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
    let basketServiceSpy: MockedObject<BasketService>;
    let accountServiceSpy: MockedObject<AccountService>;

    beforeEach(async () => {
        const basketServiceMock = {
            getBasket: vi.fn().mockName("BasketService.getBasket")
        };
        const accountServiceMock = {
            loadCurrentUser: vi.fn().mockName("AccountService.loadCurrentUser")
        };

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                { provide: BasketService, useValue: basketServiceMock },
                { provide: AccountService, useValue: accountServiceMock },
            ],
        }).compileComponents();

        basketServiceSpy = TestBed.inject(BasketService) as MockedObject<BasketService>;
        accountServiceSpy = TestBed.inject(AccountService) as MockedObject<AccountService>;
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
        vi.spyOn(localStorage, 'getItem').mockImplementation(() => 'test_basket_id');
        basketServiceSpy.getBasket.mockReturnValue(of({ id: 'test_basket_id', items: [] } as IBasket));

        component.loadBasket();

        expect(basketServiceSpy.getBasket).toHaveBeenCalledWith('test_basket_id');
    });

    it('should not load basket if basket_id does not exist in local storage', () => {
        vi.spyOn(localStorage, 'getItem').mockImplementation(() => null);

        component.loadBasket();

        expect(basketServiceSpy.getBasket).not.toHaveBeenCalled();
    });

    it('should load current user if token exists in local storage', () => {
        vi.spyOn(localStorage, 'getItem').mockImplementation(() => 'test_token');
        accountServiceSpy.loadCurrentUser.mockReturnValue(of({ email: 'test@test.com', displayName: 'Test User', role: 'User', token: 'test_token' } as IUser));

        component.loadCurrentUser();

        expect(accountServiceSpy.loadCurrentUser).toHaveBeenCalledWith('test_token');
    });

    it('should not load current user if token does not exist in local storage', () => {
        vi.spyOn(localStorage, 'getItem').mockReturnValue(null);
        accountServiceSpy.loadCurrentUser.mockReturnValue(of(null));

        component.loadCurrentUser();

        expect(accountServiceSpy.loadCurrentUser).not.toHaveBeenCalled();
    });

    it('should handle basketService errors gracefully', () => {
        vi.spyOn(localStorage, 'getItem').mockImplementation(() => 'test_basket_id');
        vi.spyOn(console, 'log').mockReturnValue(undefined);
        basketServiceSpy.getBasket.mockReturnValue(throwError(() => 'Error'));

        component.loadBasket();

        expect(console.log).toHaveBeenCalled();
    });

    it('should handle accountService errors gracefully', () => {
        vi.spyOn(localStorage, 'getItem').mockImplementation(() => 'test_token');
        vi.spyOn(console, 'log').mockReturnValue(undefined);
        accountServiceSpy.loadCurrentUser.mockReturnValue(throwError(() => 'Error'));

        component.loadCurrentUser();

        expect(console.log).toHaveBeenCalled();
    });
});
