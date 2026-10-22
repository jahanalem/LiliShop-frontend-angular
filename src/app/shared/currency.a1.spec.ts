import { afterEach, describe, expect, it, vi } from 'vitest';
import { Component, LOCALE_ID, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { formatCurrency, getCurrencySymbol } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { appConfig } from '../app.config';
import { BasketService } from '../core/services/basket.service';
import { OrdersService } from '../core/services/orders.service';
import { InvoiceService } from '../core/services/invoice.service';
import { ProductService } from '../core/services/product.service';
import { DiscountService } from '../core/services/discount.service';
import { NotificationService } from '../core/services/notification.service';
import { LanguageService } from '../core/services/language.service';
import { TranslationService } from '../core/i18n/translation.service';
import { ProductItemComponent } from '../features/user-area/shop/product-item/product-item.component';
import { AppComponent } from '../app.component';
import { BasketComponent } from '../features/user-area/basket/basket.component';
import { CheckoutDeliveryComponent } from '../features/user-area/checkout/checkout-delivery/checkout-delivery.component';
import { CheckoutService } from '../core/services/checkout.service';
import { AccountService } from '../core/services/account.service';
import { CdkStepper } from '@angular/cdk/stepper';
import { ProductVariantsEditorComponent } from '../features/admin-area/admin/products/edit-product/product-variants-editor/product-variants-editor.component';
import { ProductAttributeService } from '../core/services/product-attribute.service';
import { ProductVariantService } from '../core/services/product-variant.service';
import { EditDiscountComponent } from '../features/admin-area/admin/discounts/edit-discount/edit-discount.component';
import { OrdersComponent } from '../features/user-area/orders/orders.component';
import { OrderDetailedComponent } from '../features/user-area/orders/order-detailed/order-detailed.component';
import { EditProductComponent } from '../features/admin-area/admin/products/edit-product/edit-product.component';
import { InvoicesComponent } from '../features/admin-area/admin/invoices/invoices.component';
import { InvoiceDetailComponent } from '../features/admin-area/admin/invoices/invoice-detail/invoice-detail.component';
import { FormatValuePipe } from './pipes/format-value.pipe';
import { environment } from 'src/environments/environment';
import { IProduct } from './models/product';

const product: IProduct = {
  id: 7, name: 'Discounted shirt', description: 'Cotton', price: 29.9, previousPrice: 39.9,
  pictureUrl: 'https://example.test/shirt.png', picturePublicId: 'shirt',
  productBrandId: 1, productTypeId: 1, isActive: true, hasVariants: false, productPhotos: []
};
const savedOrder = {
  id: 73, buyerEmail: 'a1@example.test', orderDate: '2026-10-20T12:00:00Z', currency: 'usd',
  shipToAddress: { firstName: 'Test', lastName: 'Buyer', street: 'Test 1', city: 'Berlin', state: 'Berlin', zipCode: '10115' },
  deliveryMethod: 'Standard', shippingPrice: 0, subtotal: 59.8, total: 59.8, status: 'PaymentReceived',
  orderItems: [{ productId: 7, productName: 'Saved shirt', pictureUrl: '', price: 29.9, quantity: 2 }]
};
const savedInvoice = {
  id: 9, orderId: 73, invoiceNumber: 'A1-9', issueDate: '2026-10-20T12:00:00Z',
  orderDate: '2026-10-20T12:00:00Z', currency: 'usd', pricesIncludeTax: true,
  sellerLegalName: 'Test shop', sellerAddressLine: 'Test street', buyerEmail: 'a1@example.test',
  billingFirstName: 'Test', billingLastName: 'Buyer', billingStreet: 'Test 1', billingCity: 'Berlin',
  billingZipCode: '10115', shippingGross: 0, totalGross: 59.8,
  lines: [{ position: 1, productName: 'Saved shirt', quantity: 2, lineTotalGross: 59.8 }]
};
const clean = (text: string) => text.replace(/[\u200e\u200f\u061c]/g, '').replace(/[\u00a0\u202f]/g, ' ');
const expectedMoney = (amount: number, currency: string, locale: string) =>
  clean(formatCurrency(amount, locale, getCurrencySymbol(currency, 'wide', locale), currency, '1.2-2'));

@Component({ template: '<span>{{ 29.9 | formatValue:"price" }}</span>', imports: [FormatValuePipe] })
class AdminPriceCell {}

let http: HttpTestingController;

async function setup(locale = 'en', currency: unknown = 'eur', orders: any[] = [savedOrder], persistLocale = true) {
  if (persistLocale) localStorage.setItem('ls-lang', JSON.stringify({ code: locale, dir: locale === 'fa' ? 'rtl' : 'ltr', source: 'user' }));
  await TestBed.configureTestingModule({
    imports: [NoopAnimationsModule],
    providers: [
      ...appConfig.providers!, provideHttpClientTesting(), FormatValuePipe,
      { provide: TranslationService, useValue: { initialize: vi.fn(), translate: (key: string) => key } },
      { provide: BasketService, useValue: {
        addItemToBasket: vi.fn(),
        basket$: of({ id: 'a1', items: [{ ...savedOrder.orderItems[0], id: 7 }] }),
        basketTotal$: of({ shipping: 0, subtotal: 59.8, total: 59.8 })
      } },
      { provide: AccountService, useValue: { isLoggedIn: () => true } },
      { provide: CheckoutService, useValue: { getDeliveryMethods: () => of([
        { id: 1, shortName: 'Standard', price: 4.9, description: 'Test shipping' },
        { id: 2, shortName: 'Free', price: 0, description: 'Test free shipping' }
      ]) } },
      { provide: CdkStepper, useValue: { next: vi.fn(), previous: vi.fn() } },
      { provide: ProductAttributeService, useValue: { getAllAttributes: () => of([]) } },
      { provide: ProductVariantService, useValue: { getVariants: () => of([{
        id: 1, productId: 7, sku: 'A1-SHIRT', price: 29.9, isActive: true, position: 0,
        axisSignature: '', attributeValues: [], inventory: { quantityOnHand: 1, quantityReserved: 0 }
      }]) } },
      { provide: OrdersService, useValue: { getOrdersForUser: () => of(orders), getOrderDetailed: () => of(orders[0]) } },
      { provide: InvoiceService, useValue: {
        getInvoiceForOrder: () => of(savedInvoice), getInvoiceById: () => of(savedInvoice),
        getInvoices: () => of({ data: [savedInvoice], count: 1 })
      } },
      { provide: ProductService, useValue: {
        getBrands: () => of([]), getTypes: () => of([]), getProduct: () => of(undefined),
        getProductTranslations: () => of([])
      } },
      { provide: DiscountService, useValue: { getSingleDiscountForProduct: () => of(null) } },
      { provide: NotificationService, useValue: { showError: vi.fn(), showSuccess: vi.fn() } },
      { provide: ActivatedRoute, useValue: {
        snapshot: { paramMap: { get: () => '-1' } }, paramMap: of(convertToParamMap({ id: '0' }))
      } }
    ]
  }).compileComponents();
  http = TestBed.inject(HttpTestingController);
  for (const request of http.match(`${environment.apiUrl}languages`)) {
    request.flush(['en', 'de', 'fa'].map(code => ({
      code, nativeName: code, englishName: code, direction: code === 'fa' ? 'rtl' : 'ltr',
      isDefault: code === 'en', countries: []
    })));
  }
  // Older code never requests the configuration. Keep rendering it so the failure exposes the displayed money.
  const configRequests = http.match(`${environment.apiUrl}shop/currency`);
  if (currency !== 'pending') {
    for (const request of configRequests) {
      if (currency === 'failure') request.flush({}, { status: 503, statusText: 'Unavailable' });
      else request.flush(currency === null ? {} : { currency });
    }
  }
  return configRequests;
}

async function render<T>(component: Type<T>, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function text(fixture: ComponentFixture<unknown>, selector?: string): string {
  const node = selector ? fixture.nativeElement.querySelector(selector) : fixture.nativeElement;
  expect(node).toBeTruthy();
  return clean(node.textContent ?? '');
}

afterEach(() => {
  http?.verify();
  localStorage.clear();
  TestBed.resetTestingModule();
  vi.restoreAllMocks();
});

describe('A1 currency regression: real consuming views', () => {
  for (const locale of ['en', 'de', 'fa']) {
    it(`keeps discounted current and previous catalog prices in EUR in ${locale}`, async () => {
      await setup(locale);
      const fixture = await render(ProductItemComponent, { product });
      expect(text(fixture, '.product-card__price-current')).toBe(expectedMoney(29.9, 'EUR', locale));
      expect(text(fixture, '.product-card__price-old')).toBe(expectedMoney(39.9, 'EUR', locale));
    });
  }

  it('requests the backend shop currency at application initialization', async () => {
    const requests = await setup('en', 'gbp');
    expect(requests.length).toBe(1);
    const fixture = await render(ProductItemComponent, { product });
    expect(text(fixture, '.product-card__price-current')).toBe(expectedMoney(29.9, 'GBP', 'en'));
  });

  it('retains the configured money after the existing language switch and a fresh injector reload', async () => {
    await setup();
    const language = TestBed.inject(LanguageService);
    const reload = vi.spyOn(language as any, 'reloadApp').mockImplementation(() => undefined);
    language.setLanguage('de');
    http.expectOne(`${environment.apiUrl}account/preferred-language`).flush({});
    expect(reload).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('ls-lang')!).code).toBe('de');
    http.verify();
    TestBed.resetTestingModule();
    await setup('de', 'eur', [savedOrder], false);
    expect(TestBed.inject(LOCALE_ID)).toBe('de');
    const fixture = await render(ProductItemComponent, { product });
    expect(text(fixture, '.product-card__price-current')).toBe(expectedMoney(29.9, 'EUR', 'de'));
  });

  it('renders historical USD totals in the order list while the shop is EUR', async () => {
    await setup('de');
    const fixture = await render(OrdersComponent);
    expect(text(fixture, '.mat-column-total:not(mat-header-cell)')).toContain(expectedMoney(59.8, 'USD', 'de'));
    expect(text(fixture)).not.toContain('€');
  });

  it('passes saved USD through order detail to every nested line, subtotal, zero shipping and total', async () => {
    await setup('de');
    const fixture = await render(OrderDetailedComponent);
    expect(text(fixture, '.cart-item .price')).toBe(expectedMoney(29.9, 'USD', 'de'));
    expect(text(fixture, '.cart-item .total-price')).toBe(expectedMoney(59.8, 'USD', 'de'));
    const totals = [...fixture.nativeElement.querySelectorAll('app-order-totals strong')].map((n: any) => clean(n.textContent));
    expect(totals).toEqual([59.8, 0, 59.8].map(amount => expectedMoney(amount, 'USD', 'de')));
    expect(text(fixture)).not.toContain('€');
  });

  for (const currency of [undefined, null, '', 'EURO', 'ZZZ']) {
    it(`shows unavailable historical money for ${String(currency)} without substituting shop currency`, async () => {
      await setup('en', 'eur', [{ ...savedOrder, currency }]);
      const list = await render(OrdersComponent);
      expect(text(list, '.mat-column-total:not(mat-header-cell)')).toContain('Currency unavailable');
      const detail = await render(OrderDetailedComponent);
      expect(text(detail, '.cart-item .price')).toContain('Currency unavailable');
      expect(text(detail, 'app-order-totals')).toContain('Currency unavailable');
      expect(text(detail)).not.toContain('$');
      expect(text(detail)).not.toContain('€');
    });
  }

  for (const currency of ['pending', 'failure', null, 'ZZZ']) {
    it(`does not assume a currency when shop configuration is ${String(currency)}`, async () => {
      const requests = await setup('en', currency);
      const fixture = await render(ProductItemComponent, { product });
      expect(text(fixture, '.product-card__price-current')).toContain('Currency unavailable');
      expect(text(fixture)).not.toContain('$');
      expect(text(fixture)).not.toContain('€');
      for (const request of requests) if (!request.cancelled && currency === 'pending') request.flush({ currency: 'eur' });
      fixture.detectChanges();
      if (currency === 'pending') expect(text(fixture, '.product-card__price-current')).toBe(expectedMoney(29.9, 'EUR', 'en'));
    });
  }

  it('renders the admin price formatter in the configured lowercase GBP currency', async () => {
    await setup('de', 'gbp');
    expect(clean(TestBed.inject(FormatValuePipe).transform(29.9, 'price'))).toBe(expectedMoney(29.9, 'GBP', 'de'));
  });

  it('uses the configured code for the actual admin product price input adornment', async () => {
    await setup('en', 'gbp');
    const fixture = await render(EditProductComponent);
    expect(text(fixture, '[matPrefix]')).toContain('GBP');
    expect(text(fixture, '[matPrefix]')).not.toContain('€');
    fixture.componentInstance.productModel.update(model => ({ ...model, isDiscountActive: true, isPercentage: false, discountAmount: 12.5 }));
    await fixture.whenStable();
    expect(text(fixture, '[matSuffix]')).toContain('GBP');
  });

  it('preserves the invoice snapshot currency in the rendered invoice list', async () => {
    await setup('de', 'eur');
    const fixture = await render(InvoicesComponent);
    expect(text(fixture, 'td.mat-column-totalGross')).toContain('59,80 USD');
    expect(text(fixture)).not.toContain('EUR');
  });

  it('preserves saved USD for invoice detail lines, zero shipping and total', async () => {
    await setup('de', 'eur');
    const fixture = await render(InvoiceDetailComponent);
    expect(text(fixture, 'td.mat-column-lineTotalGross')).toContain('59,80 USD');
    expect(text(fixture, '.invoice-totals')).toContain('0,00 USD');
    expect(text(fixture, '.invoice-totals')).toContain('59,80 USD');
    expect(text(fixture)).not.toContain('EUR');
  });

  it('uses shop EUR for current basket lines, subtotal, zero shipping and total', async () => {
    await setup('de');
    const fixture = await render(BasketComponent);
    expect(text(fixture, '.cart-item .price')).toBe(expectedMoney(29.9, 'EUR', 'de'));
    const totals = [...fixture.nativeElement.querySelectorAll('app-order-totals strong')].map((n: any) => clean(n.textContent));
    expect(totals).toEqual([59.8, 0, 59.8].map(amount => expectedMoney(amount, 'EUR', 'de')));
  });

  it('labels both paid and free checkout delivery offers in the current shop currency', async () => {
    await setup('en', 'gbp');
    const delivery = Object.assign(() => ({ invalid: () => false }), { deliveryMethod: () => ({ value: () => 1 }) });
    const fixture = await render(CheckoutDeliveryComponent, { checkoutForm: { delivery } });
    const offers = [...fixture.nativeElement.querySelectorAll('.delivery-option strong')].map((n: any) => clean(n.textContent));
    expect(offers).toEqual([`Standard - ${expectedMoney(4.9, 'GBP', 'en')}`, `Free - ${expectedMoney(0, 'GBP', 'en')}`]);
  });

  it('uses the configured code for bulk and per-variant price inputs without changing their amounts', async () => {
    await setup('en', 'gbp');
    const fixture = await render(ProductVariantsEditorComponent, { productId: 7, defaultPrice: 29.9 });
    (fixture.nativeElement.querySelector('.bulk-toolbar mat-checkbox input') as HTMLInputElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const labels = [...fixture.nativeElement.querySelectorAll('[matSuffix]')].map((n: any) => n.textContent.trim());
    expect(labels).toEqual(['GBP', 'GBP']);
    expect((fixture.nativeElement.querySelector('.variant-price input') as HTMLInputElement).value).toBe('29.9');
  });

  it('shows a visible application error when public currency configuration fails', async () => {
    await setup('en', 'failure');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.isTesting = true;
    fixture.detectChanges();
    expect(text(fixture, '[role="alert"]')).toContain('Currency unavailable');
  });

  it('refreshes a rendered generic admin price cell when configuration arrives without changing the amount', async () => {
    const requests = await setup('de', 'pending');
    const fixture = await render(AdminPriceCell);
    expect(text(fixture)).toContain('Currency unavailable');
    requests[0].flush({ currency: 'gbp' });
    fixture.detectChanges();
    expect(text(fixture, 'span')).toBe(expectedMoney(29.9, 'GBP', 'de'));
  });

  it('refreshes fixed-amount discount tier labels with shop currency and leaves percentage labels unchanged', async () => {
    const requests = await setup('de', 'pending');
    const fixture = await render(EditDiscountComponent);
    const addTier = [...fixture.nativeElement.querySelectorAll('button')].find((button: any) =>
      button.textContent.includes('Admin.Discounts.AddTier')) as HTMLButtonElement;
    addTier.click();
    await fixture.whenStable();
    fixture.componentInstance.tiers.at(0).patchValue({ amount: 12.5, isPercentage: false });
    addTier.click();
    await fixture.whenStable();
    fixture.componentInstance.tiers.at(1).patchValue({ amount: 10, isPercentage: true });
    fixture.componentInstance.onBeforeNextStepFromTiersForm();
    expect(fixture.componentInstance.tierOptions().map(option => clean(option.label))).toEqual(['Currency unavailable', '10%']);
    requests[0].flush({ currency: 'gbp' });
    await fixture.whenStable();
    expect(fixture.componentInstance.tierOptions().map(option => clean(option.label))).toEqual([expectedMoney(12.5, 'GBP', 'de'), '10%']);
    const suffixes = [...fixture.nativeElement.querySelectorAll('.tier-group [matSuffix]')].map((node: any) => node.textContent.trim());
    expect(suffixes).toEqual(['GBP', '%']);
  });
  for (const locale of ['en', 'de', 'fa']) {
    it(`A3 shows unresolved order amounts separately from currency and confirmed zero in ${locale}`, async () => {
      await setup(locale, 'eur', [{ ...savedOrder, shippingPrice: null, total: null, moneySnapshotState: 'Unresolved' }]);
      const list = await render(OrdersComponent);
      expect(text(list, '.mat-column-total:not(mat-header-cell)')).toContain('Amount unavailable');
      const detail = await render(OrderDetailedComponent);
      const amounts = [...detail.nativeElement.querySelectorAll('app-order-totals strong')].map((n: any) => clean(n.textContent));
      expect(amounts).toEqual([expectedMoney(59.8, 'USD', locale), 'Amount unavailable', 'Amount unavailable']);
      expect(text(detail, '.cart-item .price')).toBe(expectedMoney(29.9, 'USD', locale));
      expect(text(detail, 'app-order-totals')).not.toContain('Currency unavailable');
    });
  }

});
