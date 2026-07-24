import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideCloudinaryLoader } from '@angular/common';

import { ProductDetailsComponent } from './product-details.component';
import { ProductService } from 'src/app/core/services/product.service';
import { ProductVariantService } from 'src/app/core/services/product-variant.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { AccountService } from 'src/app/core/services/account.service';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { IProduct } from 'src/app/shared/models/product';
import { IBasket } from 'src/app/shared/models/basket';
import { IProductAttribute } from 'src/app/shared/models/productAttribute';
import { IProductVariant } from 'src/app/shared/models/productVariant';

describe('ProductDetailsComponent (variant selector)', () => {
  let component: ProductDetailsComponent;
  let fixture: ComponentFixture<ProductDetailsComponent>;
  let basketServiceMock: { addItemToBasket: ReturnType<typeof vi.fn>; basket$: BehaviorSubject<IBasket | null> };

  const product: IProduct = {
    id: 42, name: 'Casual Shirt', description: 'A shirt', price: 50,
    pictureUrl: 'x.png', picturePublicId: 'x', productTypeId: 1, productBrandId: 1,
    isActive: true, hasVariants: true, productPhotos: []
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
    basketServiceMock = { addItemToBasket: vi.fn(), basket$: new BehaviorSubject<IBasket | null>(null) };

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
        provideHttpClientTesting(),
        provideCloudinaryLoader('https://res.cloudinary.com/rouhi')
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

  it('subtracts units already in the basket from what can still be added (Test 3)', () => {
    component.selectValue(10, 101); // variant 7 (P42-M), 3 on hand
    expect(component.remainingQuantity()).toBe(3);
    expect(component.canAddToBasket()).toBe(true);

    // The customer already has all 3 units of this variant in their basket.
    basketServiceMock.basket$.next({
      id: 'b1',
      items: [{ id: 42, productName: 'Casual Shirt', price: 50, quantity: 3, pictureUrl: 'x', brand: 'B', type: 'T', productVariantId: 7 }]
    });

    expect(component.basketQuantityForSelectedVariant()).toBe(3);
    expect(component.remainingQuantity()).toBe(0);   // nothing left to add
    expect(component.canAddToBasket()).toBe(false);  // add button disabled

    component.incrementQuantity();                    // stepper cannot go past the remaining cap
    expect(component.quantity()).toBe(1);

    component.addItemToBasket();                       // guarded: does not enqueue an over-stock add
    expect(basketServiceMock.addItemToBasket).not.toHaveBeenCalled();
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

  it('shows every active size value as an axis, not just the first', () => {
    // Bug 2 guard: all active variants contribute their defining size value.
    expect(component.axes()[0].values.map(v => v.name)).toEqual(['M', 'L']);
  });
});

describe('ProductDetailsComponent (Color as a defining axis)', () => {
  let component: ProductDetailsComponent;
  let fixture: ComponentFixture<ProductDetailsComponent>;

  const product: IProduct = {
    id: 40, name: 'Colour Tee', description: 'A tee', price: 30,
    pictureUrl: 'x.png', picturePublicId: 'x', productTypeId: 1, productBrandId: 1,
    isActive: true, hasVariants: true, productPhotos: []
  };

  const sizeAttr: IProductAttribute = { id: 10, code: 'size', name: 'Size', inputType: 'Select', swatchType: 'None', isFilterable: true, displayOrder: 20, isActive: true };
  const colorAttr: IProductAttribute = { id: 20, code: 'color', name: 'Color', inputType: 'MultiSelect', swatchType: 'ColorHex', isFilterable: true, displayOrder: 10, isActive: true };

  function link(variantId: number, attr: IProductAttribute, valueId: number, valueName: string, sortOrder: number) {
    return {
      id: valueId * 100 + variantId, productVariantId: variantId,
      productAttributeId: attr.id, productAttributeValueId: valueId, isDefining: true, // both axes DEFINING here
      productAttribute: attr,
      productAttributeValue: { id: valueId, productAttributeId: attr.id, code: valueName.toLowerCase(), name: valueName, sortOrder, isActive: true }
    };
  }

  // Product 40: BLUE-S and RED-S — colour is a defining axis, so the customer must be able to pick it.
  const variants: IProductVariant[] = [
    {
      id: 1, productId: 40, sku: 'P40-BLUE-S', price: 30, axisSignature: '10:101|20:201', isActive: true, position: 1,
      attributeValues: [link(1, sizeAttr, 101, 'S', 20), link(1, colorAttr, 201, 'Blue', 80)],
      inventory: { id: 1, productVariantId: 1, quantityOnHand: 4, quantityReserved: 0 }
    },
    {
      id: 2, productId: 40, sku: 'P40-RED-S', price: 30, axisSignature: '10:101|20:202', isActive: true, position: 2,
      attributeValues: [link(2, sizeAttr, 101, 'S', 20), link(2, colorAttr, 202, 'Red', 40)],
      inventory: { id: 2, productVariantId: 2, quantityOnHand: 2, quantityReserved: 0 }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ProductDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', '40']]) as any) } },
        { provide: ProductService, useValue: { getProduct: vi.fn().mockReturnValue(of(product)) } },
        { provide: ProductVariantService, useValue: { getVariants: vi.fn().mockReturnValue(of(variants)) } },
        { provide: BasketService, useValue: { addItemToBasket: vi.fn(), basket$: of(null) } },
        { provide: AccountService, useValue: { currentUser$: of(null) } },
        { provide: SubscriptionService, useValue: { checkSubscription: vi.fn().mockReturnValue(of(false)) } },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideCloudinaryLoader('https://res.cloudinary.com/rouhi')
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes Colour as a selectable axis (not just descriptive info)', () => {
    const axisNames = component.axes().map(a => a.name);
    expect(axisNames).toEqual(expect.arrayContaining(['Size', 'Color']));
    const colour = component.axes().find(a => a.name === 'Color')!;
    expect(colour.values.map(v => v.name)).toEqual(expect.arrayContaining(['Blue', 'Red']));
  });

  it('auto-selects the single size and resolves the SKU once colour is chosen', () => {
    // Both variants are size S, so the single-value Size axis is preselected; the customer
    // only needs to pick a colour.
    expect(component.selection().get(10)).toBe(101);

    component.selectValue(20, 202); // Red
    expect(component.selectedVariant()?.sku).toBe('P40-RED-S');

    component.selectValue(20, 201); // switch to Blue
    expect(component.selectedVariant()?.sku).toBe('P40-BLUE-S');
  });
});

describe('ProductDetailsComponent (attribute-aware gallery photo)', () => {
  let component: ProductDetailsComponent;
  let fixture: ComponentFixture<ProductDetailsComponent>;

  const YELLOW = 201, GREEN = 202, TROPICAL = 301, FLORAL = 302, SIZE_L = 101;
  const COLOR_ATTR = 20, PATTERN_ATTR = 30, SIZE_ATTR = 10;

  const colorAttr: IProductAttribute = { id: COLOR_ATTR, code: 'color', name: 'Color', inputType: 'Select', swatchType: 'ColorHex', isFilterable: true, displayOrder: 10, isActive: true };
  const patternAttr: IProductAttribute = { id: PATTERN_ATTR, code: 'pattern', name: 'Pattern', inputType: 'Select', swatchType: 'None', isFilterable: true, displayOrder: 20, isActive: true };
  const sizeAttr: IProductAttribute = { id: SIZE_ATTR, code: 'size', name: 'Size', inputType: 'Select', swatchType: 'None', isFilterable: true, displayOrder: 30, isActive: true };

  // Photo 1: Yellow · Photo 2: Tropical · Photo 3: Yellow+Tropical · Photo 4: Green (main, untagged fallback aside)
  const product: IProduct = {
    id: 60, name: 'Beach Shirt', description: 'A shirt', price: 70,
    pictureUrl: 'main.png', picturePublicId: 'main', productTypeId: 1, productBrandId: 1,
    isActive: true, hasVariants: true,
    productPhotos: [
      { id: 1, url: 'p1.png', publicId: 'p1', isMain: true, attributeValueIds: [YELLOW] },
      { id: 2, url: 'p2.png', publicId: 'p2', isMain: false, attributeValueIds: [TROPICAL] },
      { id: 3, url: 'p3.png', publicId: 'p3', isMain: false, attributeValueIds: [YELLOW, TROPICAL] },
      { id: 4, url: 'p4.png', publicId: 'p4', isMain: false, attributeValueIds: [GREEN] }
    ]
  };

  function link(variantId: number, attr: IProductAttribute, valueId: number, valueName: string) {
    return {
      id: valueId * 100 + variantId, productVariantId: variantId,
      productAttributeId: attr.id, productAttributeValueId: valueId, isDefining: true,
      productAttribute: attr,
      productAttributeValue: { id: valueId, productAttributeId: attr.id, code: valueName.toLowerCase(), name: valueName, sortOrder: 0, isActive: true }
    };
  }

  const variants: IProductVariant[] = [
    {
      id: 1, productId: 60, sku: 'P60-Y-TROP-L', price: 70, axisSignature: 'y', isActive: true, position: 1,
      attributeValues: [link(1, colorAttr, YELLOW, 'Yellow'), link(1, patternAttr, TROPICAL, 'Tropical'), link(1, sizeAttr, SIZE_L, 'L')],
      inventory: { id: 1, productVariantId: 1, quantityOnHand: 5, quantityReserved: 0 }
    },
    {
      id: 2, productId: 60, sku: 'P60-G-FLOR-L', price: 70, axisSignature: 'g', isActive: true, position: 2,
      attributeValues: [link(2, colorAttr, GREEN, 'Green'), link(2, patternAttr, FLORAL, 'Floral'), link(2, sizeAttr, SIZE_L, 'L')],
      inventory: { id: 2, productVariantId: 2, quantityOnHand: 5, quantityReserved: 0 }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ProductDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', '60']]) as any) } },
        { provide: ProductService, useValue: { getProduct: vi.fn().mockReturnValue(of(product)) } },
        { provide: ProductVariantService, useValue: { getVariants: vi.fn().mockReturnValue(of(variants)) } },
        { provide: BasketService, useValue: { addItemToBasket: vi.fn(), basket$: of(null) } },
        { provide: AccountService, useValue: { currentUser$: of(null) } },
        { provide: SubscriptionService, useValue: { checkSubscription: vi.fn().mockReturnValue(of(false)) } },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideCloudinaryLoader('https://res.cloudinary.com/rouhi')
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('activates no specific photo before anything is selected', () => {
    // Size is the only single-value axis here? No: every axis has 2 values, so nothing is preselected.
    expect(component.activeGalleryPhotoId()).toBeNull();
  });

  it('activates the photo matching a single selected value', () => {
    component.selectValue(COLOR_ATTR, GREEN);

    expect(component.activeGalleryPhotoId()).toBe(4);
  });

  it('activates the highest-scoring photo when several values are selected', () => {
    component.selectValue(COLOR_ATTR, YELLOW);
    component.selectValue(PATTERN_ATTR, TROPICAL);

    // Photo 3 carries both Yellow and Tropical; photos 1 and 2 carry only one each.
    expect(component.activeGalleryPhotoId()).toBe(3);
  });

  it('ignores selected values that no photo is tagged with (e.g. Size)', () => {
    component.selectValue(SIZE_ATTR, SIZE_L);

    // No photo is tagged with a size, so the gallery keeps its default photo.
    expect(component.activeGalleryPhotoId()).toBeNull();
  });

  it('does not let an untagged axis dilute an otherwise matching selection', () => {
    component.selectValue(COLOR_ATTR, YELLOW);
    component.selectValue(PATTERN_ATTR, TROPICAL);
    component.selectValue(SIZE_ATTR, SIZE_L); // resolves variant 1, adds no photo-relevant value

    expect(component.activeGalleryPhotoId()).toBe(3);
  });

  it('falls back to no override when the selection matches no tagged photo', () => {
    component.selectValue(COLOR_ATTR, GREEN);
    component.selectValue(PATTERN_ATTR, FLORAL); // no photo tagged Floral; Green still matches photo 4

    expect(component.activeGalleryPhotoId()).toBe(4);
  });

  it('returns to no override once the selection is cleared', () => {
    component.selectValue(COLOR_ATTR, GREEN);
    expect(component.activeGalleryPhotoId()).toBe(4);

    component.selectValue(COLOR_ATTR, GREEN); // clicking the selected chip deselects it
    expect(component.activeGalleryPhotoId()).toBeNull();
  });

  it('is deterministic: the first photo in display order wins a tie', () => {
    // Yellow alone is carried by photo 1 and photo 3 (score 1 each) → the earlier photo wins.
    component.selectValue(COLOR_ATTR, YELLOW);

    expect(component.activeGalleryPhotoId()).toBe(1);
    expect(component.activeGalleryPhotoId()).toBe(1); // stable across reads
  });
});
