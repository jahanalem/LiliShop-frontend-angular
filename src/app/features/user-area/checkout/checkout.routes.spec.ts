import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { CheckoutView } from 'src/app/shared/models/checkout';
import { USER_LAYOUT_ROUTES } from '../user-layout.routes';
import { CheckoutSuccessComponent } from './checkout-success/checkout-success.component';

@Component({ standalone: true, template: '<p>Home</p>' })
class HomePage {}

@Component({ standalone: true, template: '<p>Sign in</p>' })
class LoginPage {}

describe('checkout status router integration', () => {
  const id = '22222222-2222-4222-8222-222222222222';
  const url = `/checkout/success?checkout=${id}`;
  const ready: CheckoutView = {
    id, attemptId: '33333333-3333-4333-8333-333333333333', state: 'Ready', orderId: 123,
    expiresAt: '2026-10-23T10:20:00Z', subtotal: 60, shipping: 5, total: 65, currency: 'eur', reviewReason: null
  };
  let http: HttpTestingController;
  let account: BehaviorSubject<any>;
  let stripeConstructor: ReturnType<typeof vi.fn>;
  let confirmCardPayment: ReturnType<typeof vi.fn>;

  function configure(authenticated = true): void {
    account = new BehaviorSubject(authenticated ? { id: 42, email: 'buyer@example.test', token: 'synthetic' } : null);
    // Keep the production parent auth guard and lazy checkout route. Only unrelated page chrome is omitted.
    const checkoutRoute = USER_LAYOUT_ROUTES[0].children!.find(route => route.path === 'checkout');
    if (!checkoutRoute) throw new Error('Production checkout route is missing');
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      provideRouter([
        { ...checkoutRoute },
        { path: 'account/login', component: LoginPage },
        { path: '', pathMatch: 'full', component: HomePage }
      ]),
      { provide: AccountService, useValue: { currentUser$: account } },
      { provide: AuthorizationService, useValue: { getPolicy: vi.fn() } },
      { provide: MatDialog, useValue: { open: vi.fn() } },
      { provide: TranslationService, useValue: { translate: (key: string) => key } },
      { provide: BasketService, useValue: { getCurrentBasketValue: () => null } }
    ] });
    http = TestBed.inject(HttpTestingController);
    const checkout = TestBed.inject(CheckoutService);
    vi.spyOn(checkout, 'prepareCheckout');
    vi.spyOn(checkout, 'resumeSavedCheckout');
    vi.spyOn(checkout, 'confirmation');
    vi.spyOn(checkout, 'cancelSavedCheckout');
  }

  function answer(harness: RouterTestingHarness, view: CheckoutView): void {
    const request = http.expectOne(request => request.url.endsWith(`/checkout/${id}`));
    expect(request.request.method).toBe('GET');
    request.flush(view);
    harness.detectChanges();
  }

  function expectNoPaymentSubmission(): void {
    http.expectNone(request => request.method !== 'GET');
    const checkout = TestBed.inject(CheckoutService);
    expect(checkout.prepareCheckout).not.toHaveBeenCalled();
    expect(checkout.resumeSavedCheckout).not.toHaveBeenCalled();
    expect(checkout.confirmation).not.toHaveBeenCalled();
    expect(checkout.cancelSavedCheckout).not.toHaveBeenCalled();
    expect(stripeConstructor).not.toHaveBeenCalled();
    expect(confirmCardPayment).not.toHaveBeenCalled();
  }

  beforeEach(() => {
    localStorage.clear();
    confirmCardPayment = vi.fn();
    stripeConstructor = vi.fn(function () { return { confirmCardPayment }; });
    vi.stubGlobal('Stripe', stripeConstructor);
  });

  afterEach(() => {
    http?.verify();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('accepts the payment component navigation with checkout query and no state.order', async () => {
    configure();
    const harness = await RouterTestingHarness.create('/');
    const router = TestBed.inject(Router);
    await router.navigate(['checkout/success'], { queryParams: { checkout: id } });
    harness.detectChanges();
    expect(router.url).toBe(url);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(CheckoutSuccessComponent);
    expect(harness.routeNativeElement?.textContent).not.toContain('Payment received');
    answer(harness, { ...ready, state: 'PaymentVerified' });
    expect(harness.routeNativeElement?.textContent).toContain('Payment received');
    expectNoPaymentSubmission();
  });

  it('opens and reloads the direct status URL without preparing or confirming payment', async () => {
    const saved = JSON.stringify({ requestKey: '11111111-1111-4111-8111-111111111111', checkoutId: id, fingerprint: 'retained-input' });
    localStorage.setItem('lilishop.checkout.v1:42', saved);
    configure();
    let harness = await RouterTestingHarness.create(url);
    answer(harness, ready);
    expect(harness.routeNativeElement?.textContent).toContain('has not been verified');
    expectNoPaymentSubmission();
    http.verify();

    // Recreate the router/component injector while keeping browser storage and the URL, as on reload.
    TestBed.resetTestingModule();
    configure();
    harness = await RouterTestingHarness.create(url);
    expect(TestBed.inject(Router).url).toBe(url);
    answer(harness, ready);
    expect(harness.routeNativeElement?.textContent).toContain('has not been verified');
    expect(localStorage.getItem('lilishop.checkout.v1:42')).toBe(saved);
    expectNoPaymentSubmission();
  });

  it('ignores a claimed router success and waits for the server status', async () => {
    configure();
    const harness = await RouterTestingHarness.create('/');
    await TestBed.inject(Router).navigateByUrl(url, { state: { order: { id: 123 }, paid: true } });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).not.toContain('Payment received');
    answer(harness, ready);
    expect(harness.routeNativeElement?.textContent).toContain('has not been verified');
    expect(harness.routeNativeElement?.textContent).not.toContain('Payment received');
    expectNoPaymentSubmission();
  });

  it('renders review from the server without claiming payment received', async () => {
    configure();
    const harness = await RouterTestingHarness.create(url);
    answer(harness, { ...ready, state: 'ReviewRequired', reviewReason: 'financial_facts_mismatch' });
    expect(harness.routeNativeElement?.textContent).toContain('needs review');
    expect(harness.routeNativeElement?.textContent).not.toContain('Payment received');
    expectNoPaymentSubmission();
  });

  it.each([401, 404])('does not claim success when the status API rejects access with %s', async status => {
    configure();
    const harness = await RouterTestingHarness.create(url);
    const request = http.expectOne(request => request.url.endsWith(`/checkout/${id}`));
    expect(request.request.method).toBe('GET');
    request.flush({ code: status === 404 ? 'checkout_not_found' : 'authentication_required' }, { status, statusText: 'Rejected' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('status is unavailable');
    expect(harness.routeNativeElement?.textContent).not.toContain('Payment received');
    expect(harness.routeNativeElement?.querySelector('a[href="/orders/123"]')).toBeNull();
    expectNoPaymentSubmission();
  });

  it('handles a direct status URL without a checkout identity without sending payment requests', async () => {
    configure();
    const harness = await RouterTestingHarness.create('/checkout/success');
    expect(harness.routeNativeElement?.textContent).toContain('No saved checkout');
    http.expectNone(() => true);
    expectNoPaymentSubmission();
  });

  it('keeps the production parent authentication guard for anonymous direct visits', async () => {
    configure(false);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, LoginPage);
    expect(TestBed.inject(Router).url).toContain('/account/login');
    expect(harness.routeNativeElement?.textContent).toContain('Sign in');
    http.expectNone(() => true);
    expectNoPaymentSubmission();
  });
});
