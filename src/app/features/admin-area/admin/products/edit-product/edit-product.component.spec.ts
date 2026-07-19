import { describe, expect, it, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { EditProductComponent } from './edit-product.component';
import { ProductService } from 'src/app/core/services/product.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { DiscountService } from 'src/app/core/services/discount.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { IProduct } from 'src/app/shared/models/product';

describe('EditProductComponent', () => {
  let productServiceMock: any;
  let routerMock: { navigate: ReturnType<typeof vi.fn>; navigateByUrl: ReturnType<typeof vi.fn> };

  const created: IProduct = {
    id: 49, name: 'Base', description: 'desc', price: 100, pictureUrl: '', picturePublicId: '',
    productTypeId: 2, productBrandId: 3, isActive: true, productPhotos: []
  };

  async function setup(routeId: string) {
    productServiceMock = {
      getBrands: vi.fn().mockReturnValue(of([{ id: 3, name: 'Brand', isActive: true }])),
      getTypes: vi.fn().mockReturnValue(of([{ id: 2, name: 'Type', isActive: true }])),
      getProduct: vi.fn().mockReturnValue(of(undefined)),
      getProductTranslations: vi.fn().mockReturnValue(of([])),
      createProduct: vi.fn().mockReturnValue(of(created)),
      updateProduct: vi.fn().mockReturnValue(of(created))
    };
    routerMock = { navigate: vi.fn(), navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, EditProductComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: LanguageService, useValue: { languages: signal([{ code: 'en', isDefault: true }]) } },
        { provide: StorageService, useValue: { set: vi.fn(), get: vi.fn(), delete: vi.fn() } },
        { provide: DiscountService, useValue: { getSingleDiscountForProduct: vi.fn().mockReturnValue(of(null)) } },
        { provide: NotificationService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: TranslationService, useValue: { translate: (k: string) => k } },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    const fixture: ComponentFixture<EditProductComponent> = TestBed.createComponent(EditProductComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component };
  }

  beforeEach(() => vi.clearAllMocks());

  it('BUG 1: creating a product on the /edit/-1 sentinel redirects to the real new id', async () => {
    const { component } = await setup('-1'); // the "new product" sentinel route

    // A valid form for a base product (no pictures / variants yet).
    component.productModel.set({
      isActive: true, name: 'Base', description: 'desc', price: 100,
      productBrandId: 3, productTypeId: 2,
      isDiscountActive: false, discountAmount: null, isPercentage: true,
      discountStartDateDate: null, discountStartDateTime: null,
      discountEndDateDate: null, discountEndDateTime: null
    });

    component.onSubmit();

    expect(productServiceMock.createProduct).toHaveBeenCalledTimes(1);
    // Must navigate to the REAL id (49), never leave the address bar on -1.
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/products/edit', 49], { replaceUrl: true });
  });

  it('does not redirect when updating an existing product', async () => {
    const { component } = await setup('49');
    component.productModel.set({
      isActive: true, name: 'Base', description: 'desc', price: 100,
      productBrandId: 3, productTypeId: 2,
      isDiscountActive: false, discountAmount: null, isPercentage: true,
      discountStartDateDate: null, discountStartDateTime: null,
      discountEndDateDate: null, discountEndDateTime: null
    });
    // Simulate an already-loaded product so onSubmit takes the update path.
    (component as any).adminProduct.set({ ...created, discount: null });

    component.onSubmit();

    expect(productServiceMock.updateProduct).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
