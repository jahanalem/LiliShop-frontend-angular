import { describe, expect, it, vi } from "vitest";
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
      { id: 102, productAttributeId: 10, code: 's', name: 'S', sortOrder: 20, isActive: true },
      { id: 103, productAttributeId: 10, code: 'l', name: 'L', sortOrder: 40, isActive: true }
    ]
  };
  const colorAttr: IProductAttribute = {
    id: 20, code: 'color', name: 'Color', inputType: 'MultiSelect', swatchType: 'ColorHex',
    isFilterable: true, displayOrder: 10, isActive: true,
    values: [
      { id: 201, productAttributeId: 20, code: 'blue', name: 'Blue', colorHex: '#1976D2', sortOrder: 80, isActive: true },
      { id: 202, productAttributeId: 20, code: 'red', name: 'Red', colorHex: '#D32F2F', sortOrder: 40, isActive: true }
    ]
  };

  function link(variantId: number, attributeId: number, valueId: number, isDefining: boolean) {
    return { id: valueId * 100 + variantId, productVariantId: variantId, productAttributeId: attributeId, productAttributeValueId: valueId, isDefining };
  }

  function sizeVariant(id: number, sku: string, sizeValueId: number): IProductVariant {
    return {
      id, productId: 39, sku, price: 50, axisSignature: `10:${sizeValueId}`, isActive: true, position: id,
      attributeValues: [link(id, 10, sizeValueId, true)],
      inventory: { id, productVariantId: id, quantityOnHand: 5, quantityReserved: 0 }
    };
  }

  async function setup(variants: IProductVariant[], attributes: IProductAttribute[] = [sizeAttr, colorAttr]) {
    variantServiceMock = {
      getVariants: vi.fn().mockReturnValue(of(variants)),
      saveVariants: vi.fn().mockImplementation((_id: number, _rows: IVariantUpsertRow[]) => of(variants)),
      deleteVariant: vi.fn().mockReturnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ProductVariantsEditorComponent],
      providers: [
        { provide: ProductAttributeService, useValue: { getAllAttributes: vi.fn().mockReturnValue(of(attributes)) } },
        { provide: ProductVariantService, useValue: variantServiceMock },
        { provide: NotificationService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: () => of(true) }) } },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    const fixture: ComponentFixture<ProductVariantsEditorComponent> = TestBed.createComponent(ProductVariantsEditorComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('productId', 39);
    fixture.componentRef.setInput('defaultPrice', 50);
    fixture.detectChanges();
    return { fixture, component };
  }

  it('defaults defining attributes to the Select types for a fresh product', async () => {
    const { component } = await setup([sizeVariant(1, 'P39-M', 101)]);
    expect(component.definingAttributes().map(a => a.code)).toEqual(['size']);
    expect(component.descriptiveAttributes().map(a => a.code)).toEqual(['color']);
  });

  it('Bug 1 / Example 2: adding a third distinct size sends three distinct axis signatures', async () => {
    // P39-M and P39-S already exist; the admin adds P39-L. The payload must carry three
    // distinct defining size values — the reported "same defining combination" must not occur.
    const { component } = await setup([sizeVariant(1, 'P39-M', 101), sizeVariant(2, 'P39-S', 102)]);

    component.addRow();
    const newIndex = component.rows().length - 1;
    component.setSingleValue(newIndex, 10, 103); // Size L
    component.save();

    const payload = variantServiceMock.saveVariants.mock.calls[0][1] as IVariantUpsertRow[];
    const signatures = payload.map(p => p.axisValues.map(a => `${a.attributeId}:${a.valueId}`).sort().join('|'));
    expect(new Set(signatures).size).toBe(3);
    expect(signatures).toEqual(expect.arrayContaining(['10:101', '10:102', '10:103']));
  });

  it('Bug 1 / Example 1: marking Color defining lets two colours of one size be distinct variants', async () => {
    const { component } = await setup([]);

    component.toggleDefiningAttribute(20); // Color becomes defining
    expect(component.definingAttributes().map(a => a.code)).toEqual(expect.arrayContaining(['size', 'color']));

    component.addRow();
    component.setSingleValue(0, 10, 102); // Size S
    component.setSingleValue(0, 20, 201); // Blue
    component.addRow();
    component.setSingleValue(1, 10, 102); // Size S
    component.setSingleValue(1, 20, 202); // Red
    component.save();

    const payload = variantServiceMock.saveVariants.mock.calls[0][1] as IVariantUpsertRow[];
    // Both variants are defined by size+color; the two signatures differ only by colour.
    const signatures = payload.map(p => p.axisValues.map(a => `${a.attributeId}:${a.valueId}`).sort().join('|'));
    expect(new Set(signatures).size).toBe(2);
    payload.forEach(p => expect(p.descriptiveValues).toHaveLength(0));
  });

  it('keeps Color descriptive (multi-value) when it is not a defining attribute', async () => {
    const { component } = await setup([]);
    // Color defaults to descriptive. A striped shirt in M carries two colours descriptively.
    component.addRow();
    component.setSingleValue(0, 10, 101);       // Size M (defining)
    component.setMultiValue(0, 20, [201, 202]); // Blue + Red (descriptive)
    component.save();

    const payload = variantServiceMock.saveVariants.mock.calls[0][1] as IVariantUpsertRow[];
    expect(payload[0].axisValues).toEqual([{ attributeId: 10, valueId: 101 }]);
    expect(payload[0].descriptiveValues).toEqual(expect.arrayContaining([
      { attributeId: 20, valueId: 201 }, { attributeId: 20, valueId: 202 }
    ]));
  });

  it('reloaded variants retain their defining axis values', async () => {
    const { component } = await setup([sizeVariant(1, 'P39-M', 101), sizeVariant(2, 'P39-S', 102)]);
    const rows = component.rows();
    expect(rows.map(r => component.singleValue(r, 10))).toEqual([101, 102]);
  });

  it('generates only the missing size combinations as draft rows', async () => {
    const { component } = await setup([sizeVariant(1, 'P39-M', 101)]);
    component.generatorSelections = { 10: [101, 102, 103] }; // M, S, L — M exists

    component.generateCombinations();

    const drafts = component.rows().filter(r => r.id === 0);
    expect(drafts.length).toBe(2); // S and L
    expect(drafts.map(d => component.singleValue(d, 10)).sort()).toEqual([102, 103]);
  });
});
