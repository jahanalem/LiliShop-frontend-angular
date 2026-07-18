import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductDetailsComponent } from './product-details.component';
import { ProductService } from 'src/app/core/services/product.service';
import { ProductVariantService } from 'src/app/core/services/product-variant.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { AccountService } from 'src/app/core/services/account.service';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { IProduct } from 'src/app/shared/models/product';
import { IProductAttribute } from 'src/app/shared/models/productAttribute';
import { IProductVariant } from 'src/app/shared/models/productVariant';

describe('ProductDetailsComponent (variant selector)', () => {
  let component: ProductDetailsComponent;
  let fixture: ComponentFixture<ProductDetailsComponent>;
  let basketServiceMock: { addItemToBasket: ReturnType<typeof vi.fn> };

  const product: IProduct = {
    id: 42, name: 'Casual Shirt', description: 'A shirt', price: 50,
    pictureUrl: 'x.png', picturePublicId: 'x', productTypeId: 1, productBrandId: 1,
    isActive: true, productCharacteristics: [], productPhotos: []
  };

  const sizeAttr: IProductAttribute = { id: 10, code: 'size', name: 'Size', inputType: 'Select', swatchType: 'None', isFilterable: true, displayOrder: 20, isActive: true };
  const colorAttr: IProductAttribute = { id: 20, code: 'color', name: 'Color', inputType: 'MultiSelect', swatchType: 'ColorHex', isFilterable: true, displayOrder: 10, isActive: true };

  function link(variantId: number, attr: IProductAttribute, valueId: number, valueName: string, isDefining: boolean, sortOrder = 0) {
    return {
      id: valueId * 100 + variantId, productVariantId: variantId,
      productAttributeId: attr.id, productAttributeValueId: valueId, isDefining,
      productAttribute: attr,
      productAttributeValue: { id: valueId, productAttributeId: attr.id, code: valueName.toLowerCase(), name: valueName, sortOrder, isActive: true }
    };
  }

  // Striped shirt: sizes M (in stock) and L (out of stock); both are Yellow+Black descriptively.
  const variants: IProductVariant[] = [
    {
      id: 7, productId: 42, sku: 'P42-M', price: 50, axisSignature: '10:101', isActive: true, position: 1,
      attributeValues: [link(7, sizeAttr, 101, 'M', true, 30), link(7, colorAttr, 201, 'Yellow', false, 60), link(7, colorAttr, 202, 'Black', false, 10)],
      inventory: { id: 1, productVariantId: 7, quantityOnHand: 3, quantityReserved: 0 }
    },
    {
      id: 8, productId: 42, sku: 'P42-L', price: 55, axisSignature: '10:102', isActive: true, position: 2,
      attributeValues: [link(8, sizeAttr, 102, 'L', true, 40)],
      inventory: { id: 2, productVariantId: 8, quantityOnHand: 0, quantityReserved: 0 }
    }
  ];

  beforeEach(async () => {
    basketServiceMock = { addItemToBasket: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ProductDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', '42']]) as any) } },
        { provide: ProductService, useValue: { getProduct: vi.fn().mockReturnValue(of(product)) } },
        { provide: ProductVariantService, useValue: { getVariants: vi.fn().mockReturnValue(of(variants)) } },
        { provide: BasketService, useValue: basketServiceMock },
        { provide: AccountService, useValue: { currentUser$: of(null) } },
        { provide: SubscriptionService, useValue: { checkSubscription: vi.fn().mockReturnValue(of(false)) } },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailsComponent);
    component = fixture.componentInstance;
    // ActivatedRoute paramMap mock: ParamMap interface needs get(); a Map provides it.
    fixture.detectChanges();
  });

  it('derives one Size axis with both values from the variants', () => {
    const axes = component.axes();
    expect(axes.length).toBe(1);
    expect(axes[0].name).toBe('Size');
    expect(axes[0].values.map(v => v.name)).toEqual(['M', 'L']);
  });

  it('has no selected variant until the axis is chosen', () => {
    expect(component.selectedVariant()).toBeNull();
    expect(component.canAddToBasket()).toBe(false);
  });

  it('resolves the variant, price, and descriptive colors after selection', () => {
    component.selectValue(10, 101); // Size M

    const variant = component.selectedVariant();
    expect(variant?.sku).toBe('P42-M');
    expect(component.displayPrice()).toBe(50);
    expect(component.availableQuantity()).toBe(3);
    expect(component.descriptiveInfo()).toEqual([{ name: 'Color', values: 'Black, Yellow' }]);
    expect(component.canAddToBasket()).toBe(true);
  });

  it('marks the out-of-stock size unavailable and blocks adding it', () => {
    expect(component.isValueUnavailable(10, 102)).toBe(true); // L: 0 on hand
    expect(component.isValueUnavailable(10, 101)).toBe(false);

    component.selectValue(10, 102);
    expect(component.selectedVariant()?.sku).toBe('P42-L');
    expect(component.isOutOfStock()).toBe(true);
    expect(component.canAddToBasket()).toBe(false);
  });

  it('caps the quantity stepper at the available stock', () => {
    component.selectValue(10, 101); // 3 available

    component.incrementQuantity();
    component.incrementQuantity();
    component.incrementQuantity(); // would be 4 — capped
    expect(component.quantity()).toBe(3);
  });

  it('sends the variant id, price, and description to the basket', () => {
    component.selectValue(10, 101);
    component.addItemToBasket();

    expect(basketServiceMock.addItemToBasket).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42 }),
      1,
      expect.objectContaining({ id: 7, price: 50, description: 'Color: Black, Yellow · Size: M' })
    );
  });

  it('deselects when the selected chip is clicked again', () => {
    component.selectValue(10, 101);
    component.selectValue(10, 101);
    expect(component.selectedVariant()).toBeNull();
  });
});
