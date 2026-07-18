import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductVariantsEditorComponent } from './product-variants-editor.component';
import { ProductAttributeService } from 'src/app/core/services/product-attribute.service';
import { ProductVariantService } from 'src/app/core/services/product-variant.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { IProductAttribute } from 'src/app/shared/models/productAttribute';
import { IProductVariant, IVariantUpsertRow } from 'src/app/shared/models/productVariant';

describe('ProductVariantsEditorComponent', () => {
  let component: ProductVariantsEditorComponent;
  let fixture: ComponentFixture<ProductVariantsEditorComponent>;
  let variantServiceMock: {
    getVariants: ReturnType<typeof vi.fn>;
    saveVariants: ReturnType<typeof vi.fn>;
    deleteVariant: ReturnType<typeof vi.fn>;
  };

  const sizeAttr: IProductAttribute = {
    id: 10, code: 'size', name: 'Size', inputType: 'Select', swatchType: 'None',
    isFilterable: true, displayOrder: 20, isActive: true,
    values: [
      { id: 101, productAttributeId: 10, code: 'm', name: 'M', sortOrder: 30, isActive: true },
      { id: 102, productAttributeId: 10, code: 'l', name: 'L', sortOrder: 40, isActive: true }
    ]
  };
  const patternAttr: IProductAttribute = {
    id: 30, code: 'pattern', name: 'Pattern', inputType: 'Select', swatchType: 'Image',
    isFilterable: true, displayOrder: 30, isActive: true,
    values: [
      { id: 301, productAttributeId: 30, code: 'striped', name: 'Striped', sortOrder: 20, isActive: true },
      { id: 302, productAttributeId: 30, code: 'floral', name: 'Floral', sortOrder: 30, isActive: true }
    ]
  };
  const colorAttr: IProductAttribute = {
    id: 20, code: 'color', name: 'Color', inputType: 'MultiSelect', swatchType: 'ColorHex',
    isFilterable: true, displayOrder: 10, isActive: true,
    values: [
      { id: 201, productAttributeId: 20, code: 'yellow', name: 'Yellow', colorHex: '#FBC02D', sortOrder: 60, isActive: true },
      { id: 202, productAttributeId: 20, code: 'black', name: 'Black', colorHex: '#000000', sortOrder: 10, isActive: true }
    ]
  };

  const existingVariant: IProductVariant = {
    id: 7, productId: 42, sku: 'P42-STRIPED-M', price: 50, axisSignature: '10:101|30:301',
    isActive: true, position: 1,
    attributeValues: [
      { id: 1, productVariantId: 7, productAttributeId: 10, productAttributeValueId: 101, isDefining: true },
      { id: 2, productVariantId: 7, productAttributeId: 30, productAttributeValueId: 301, isDefining: true },
      { id: 3, productVariantId: 7, productAttributeId: 20, productAttributeValueId: 201, isDefining: false },
      { id: 4, productVariantId: 7, productAttributeId: 20, productAttributeValueId: 202, isDefining: false }
    ],
    inventory: { id: 1, productVariantId: 7, quantityOnHand: 5, quantityReserved: 0 }
  };

  beforeEach(async () => {
    variantServiceMock = {
      getVariants: vi.fn().mockReturnValue(of([existingVariant])),
      saveVariants: vi.fn().mockReturnValue(of([existingVariant])),
      deleteVariant: vi.fn().mockReturnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ProductVariantsEditorComponent],
      providers: [
        { provide: ProductAttributeService, useValue: { getAllAttributes: vi.fn().mockReturnValue(of([sizeAttr, colorAttr, patternAttr])) } },
        { provide: ProductVariantService, useValue: variantServiceMock },
        { provide: NotificationService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: () => of(true) }) } },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductVariantsEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('productId', 42);
    fixture.componentRef.setInput('defaultPrice', 50);
    fixture.detectChanges();
  });

  it('offers every active Select attribute as an axis and MultiSelect as descriptive', () => {
    expect(component.axisAttributes().map(a => a.code)).toEqual(['size', 'pattern']);
    expect(component.descriptiveAttributes().map(a => a.code)).toEqual(['color']);
  });

  it('maps an existing variant into axis and descriptive selections', () => {
    const row = component.rows()[0];
    expect(row.axisSelections[10]).toBe(101); // Size M
    expect(row.axisSelections[30]).toBe(301); // Pattern Striped
    expect(row.descriptiveSelections[20]).toEqual([201, 202]); // both colors
  });

  it('saves axis and descriptive values back per attribute type', () => {
    component.setAxisValue(0, 10, 102); // switch to L
    component.save();

    const payload = variantServiceMock.saveVariants.mock.calls[0][1] as IVariantUpsertRow[];
    expect(payload[0].axisValues).toEqual(expect.arrayContaining([
      { attributeId: 10, valueId: 102 },
      { attributeId: 30, valueId: 301 }
    ]));
    expect(payload[0].descriptiveValues).toEqual(expect.arrayContaining([
      { attributeId: 20, valueId: 201 },
      { attributeId: 20, valueId: 202 }
    ]));
  });

  it('generates only the missing combinations as draft rows', () => {
    component.generatorSelections = { 10: [101, 102], 30: [301] }; // M/L × Striped

    component.generateCombinations();

    // Striped+M exists already → only Striped+L is added.
    const drafts = component.rows().filter(r => r.id === 0);
    expect(drafts.length).toBe(1);
    expect(drafts[0].axisSelections).toEqual({ 10: 102, 30: 301 });
    expect(drafts[0].price).toBe(50);
    expect(component.dirty()).toBe(true);
  });

  it('reports when every selected combination already exists', () => {
    const notifications = TestBed.inject(NotificationService);
    component.generatorSelections = { 10: [101], 30: [301] }; // exactly the existing variant

    component.generateCombinations();

    expect(component.rows().filter(r => r.id === 0).length).toBe(0);
    expect(notifications.showSuccess).toHaveBeenCalled();
  });
});
