import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { NavBarComponent } from './nav-bar.component';
import { BasketService } from '../../../core/services/basket.service';
import { AccountService } from '../../../core/services/account.service';
import { ThemeService } from '../../../core/services/theme.service';
import { IUser } from 'src/app/shared/models/user';
import { PolicyNames } from 'src/app/shared/models/policy';
import { environment } from 'src/environments/environment';

describe('NavBarComponent', () => {
    let component: NavBarComponent;
    let fixture: ComponentFixture<NavBarComponent>;
    let basketServiceSpy: MockedObject<BasketService>;
    let accountServiceSpy: MockedObject<AccountService>;
    let currentUserSubject: BehaviorSubject<IUser | null>;
    let http: HttpTestingController;
    const policiesUrl = `${environment.apiUrl}authorization/policies/`;
    const user: IUser = { email: 'operator@example.test', displayName: 'Synthetic operator', role: 'SuperAdmin', token: 'synthetic', emailConfirmed: true };

    beforeEach(async () => {
        currentUserSubject = new BehaviorSubject<IUser | null>(null);
        await TestBed.configureTestingModule({
            imports: [NavBarComponent],
            providers: [
                provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
                { provide: BasketService, useValue: { basket$: of(null) } },
                { provide: AccountService, useValue: { logout: vi.fn(), currentUser$: currentUserSubject.asObservable() } }
            ]
        }).compileComponents();
        http = TestBed.inject(HttpTestingController);
        basketServiceSpy = TestBed.inject(BasketService) as MockedObject<BasketService>;
        accountServiceSpy = TestBed.inject(AccountService) as MockedObject<AccountService>;
        fixture = TestBed.createComponent(NavBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
        currentUserSubject.complete();
        http.verify();
        localStorage.clear();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.hasAccessToAdminPanel()).toBe(false);
        http.expectNone(policiesUrl);
    });

    it('should toggle the theme and reflect it on the document element', async () => {
        const themeService = TestBed.inject(ThemeService);
        const wasDark = themeService.isDark();
        themeService.toggleTheme();
        await fixture.whenStable();
        expect(themeService.isDark()).toBe(!wasDark);
        expect(document.documentElement.getAttribute('data-theme')).toBe(wasDark ? 'light' : 'dark');
    });

    it('should call accountService.logout() on logout()', () => {
        component.logout();
        expect(accountServiceSpy.logout).toHaveBeenCalledOnce();
    });

    it('should assign basket$ from the BasketService', async () => {
        expect(component.basket$).toBe(basketServiceSpy.basket$);
        expect(await firstValueFrom(component.basket$)).toBeNull();
    });

    it('should update currentUserSource when currentUser$ emits', async () => {
        // detectChanges already called ngOnInit; one component lifecycle owns one policy subscription.
        currentUserSubject.next(user);
        const request = http.expectOne(policiesUrl);
        expect(request.request.method).toBe('GET');
        request.flush({ [PolicyNames.RequireAtLeastAdminPanelViewerRole]: ['SuperAdmin', 'Administrator', 'AdminPanelViewer'] });
        expect(await firstValueFrom(component.currentUser$)).toEqual(user);
        expect(component.hasAccessToAdminPanel()).toBe(true);
        currentUserSubject.next(null);
        expect(component.hasAccessToAdminPanel()).toBe(false);
        http.expectNone(policiesUrl);
    });

    it('keeps ordinary users out of the admin panel using the returned policy', () => {
        currentUserSubject.next({ ...user, role: 'Standard' });
        http.expectOne(policiesUrl).flush({ [PolicyNames.RequireAtLeastAdminPanelViewerRole]: ['SuperAdmin', 'Administrator', 'AdminPanelViewer'] });
        expect(component.hasAccessToAdminPanel()).toBe(false);
    });
});
