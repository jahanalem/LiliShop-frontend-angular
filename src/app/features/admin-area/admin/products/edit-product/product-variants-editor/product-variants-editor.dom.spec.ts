/**
 * DOM-level regression tests for the variant editor.
 *
 * These drive the real template (mat-select overlays), not the component methods, because the bugs
 * they guard against live in the template bindings:
 *
 *   BUG 3 — editing one variant changed another. Root cause: the axis <mat-select> handlers sit
 *   inside a nested `@for (attribute ...)`, so `$index` there was the ATTRIBUTE index, not the row
 *   index. Every axis select wrote to the wrong row (all to row 0 when there was one axis). Fixed by
 *   aliasing the outer row index (`let rowIndex = $index`) and tracking rows by a stable `row.key`.
 *
 *   BUG 2 — a variant's defining selections collapsed to one attribute on save (SKU "P49-BLACK"
 *   instead of all axes). Same root cause: the per-attribute selects routed to different rows.
 */
import { describe, expect, it, vi } from 'vitest';
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

const sizeAttr: IProductAttribute = {
  id: 10, code: 'size', name: 'Size', inputType: 'Select', swatchType: 'None',
  isFilterable: true, displayOrder: 10, isActive: true,
  values: [
    { id: 101, productAttributeId: 10, code: 'xs', name: 'X-Small', sortOrder: 10, isActive: true },
    { id: 102, productAttributeId: 10, code: 's', name: 'Small', sortOrder: 20, isActive: true },
    { id: 103, productAttributeId: 10, code: 'm', name: 'Medium', sortOrder: 30, isActive: true }
  ]
};
const patternAttr: IProductAttribute = {
  id: 30, code: 'pattern', name: 'Pattern', inputType: 'Select', swatchType: 'None',
  isFilterable: true, displayOrder: 20, isActive: true,
  values: [
    { id: 301, productAttributeId: 30, code: 'solid', name: 'Solid', sortOrder: 10, isActive: true },
    { id: 302, productAttributeId: 30, code: 'striped', name: 'Striped', sortOrder: 20, isActive: true }
  ]
};

/** The M6 default: a fresh product owns ONE axis-less variant (no attribute links). */
function axisLessDefault(id: number): IProductVariant {
  return {
    id, productId: 49, sku: 'P49', price: 100, axisSignature: '', isActive: true, position: 0,
    attributeValues: [],
    inventory: { id, productVariantId: id, quantityOnHand: 0, quantityReserved: 0 }
  };
}

async function setup(attributes: IProductAttribute[], variants: IProductVariant[]) {
  const variantServiceMock = {
    getVariants: vi.fn().mockReturnValue(of(variants)),
    saveVariants: vi.fn().mockImplementation((_id: number, _rows: IVariantUpsertRow[]) => of(variants)),
    generateVariants: vi.fn().mockReturnValue(of([])),
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
  fixture.componentRef.setInput('productId', 49);
  fixture.componentRef.setInput('defaultPrice', 100);
  fixture.detectChanges();
  return { fixture, component, variantServiceMock };
}

/** Opens the Nth <mat-select> on the page and clicks the option whose text matches (via the overlay). */
function pickOption(fixture: ComponentFixture<any>, selectIndex: number, optionText: string) {
  const selects = fixture.nativeElement.querySelectorAll('mat-select');
  (selects[selectIndex].querySelector('.mat-mdc-select-trigger') as HTMLElement).click();
  fixture.detectChanges();
  const options = Array.from(document.querySelectorAll('mat-option')) as HTMLElement[];
  const target = options.find(o => o.textContent?.trim() === optionText);
  if (!target) {
    throw new Error(`option "${optionText}" not found among [${options.map(o => o.textContent?.trim()).join(', ')}]`);
  }
  target.click();
  fixture.detectChanges();
}

describe('ProductVariantsEditorComponent (DOM)', () => {
  it('BUG 3: an axis pick on one row never bleeds into another row', async () => {
    // Single defining Select attribute → exactly one <mat-select> per row.
    const { fixture, component } = await setup([sizeAttr], [axisLessDefault(5)]);

    component.addRow(); // row 1
    component.addRow(); // row 2
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const selects = fixture.nativeElement.querySelectorAll('mat-select');
    expect(selects.length).toBe(3); // one per row (default + 2 new)

    pickOption(fixture, 1, 'X-Small'); // row 1 → 101
    pickOption(fixture, 2, 'Medium');  // row 2 → 103

    const rows = component.rows();
    expect(component.singleValue(rows[0], 10)).toBeNull(); // default row untouched
    expect(component.singleValue(rows[1], 10)).toBe(101);  // row 1 kept its own value
    expect(component.singleValue(rows[2], 10)).toBe(103);  // row 2 kept its own value
  });

  it('BUG 2: every defining axis picked on a row is saved on THAT row (SKU keeps all axes)', async () => {
    // Two defining Select axes (Size + Pattern) → two <mat-select>s per row, rendered defining-first.
    const { fixture, component, variantServiceMock } = await setup([sizeAttr, patternAttr], [axisLessDefault(5)]);
    expect(component.definingAttributes().map(a => a.code)).toEqual(['size', 'pattern']);

    component.addRow(); // row 1 (the new variant)
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Row 0 selects: [size, pattern]; row 1 selects: [size, pattern] → indices 2 and 3.
    pickOption(fixture, 2, 'X-Small'); // row 1 Size
    pickOption(fixture, 3, 'Striped'); // row 1 Pattern

    // An ACTIVE axis-less row may not coexist with axis rows (it would be unsellable in the
    // storefront) — retire the placeholder default so the save passes the uniform-axes check.
    component.updateRow(0, { isActive: false });

    component.save();

    const payload = variantServiceMock.saveVariants.mock.calls[0][1] as IVariantUpsertRow[];
    const newRow = payload.find(p => p.id === 0)!;
    const axisPairs = newRow.axisValues.map(a => `${a.attributeId}:${a.valueId}`).sort();
    expect(axisPairs).toEqual(['10:101', '30:302']); // BOTH axes present on the one new row
    expect(newRow.descriptiveValues).toHaveLength(0);
    // The default row (index 0) must NOT have absorbed the new row's axis picks.
    const defaultRow = payload.find(p => p.id === 5)!;
    expect(defaultRow.axisValues).toHaveLength(0);
  });

  it('deleting a middle row leaves the remaining rows selections intact (stable row keys)', async () => {
    const { fixture, component } = await setup([sizeAttr], [axisLessDefault(5)]);
    component.addRow();
    component.addRow();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    pickOption(fixture, 1, 'X-Small'); // row 1 → 101
    pickOption(fixture, 2, 'Medium');  // row 2 → 103

    component.removeRow(1); // remove the X-Small row
    fixture.detectChanges();

    const rows = component.rows();
    expect(rows.length).toBe(2);
    // The surviving new row must still be Medium — not shifted onto a stale mat-select position.
    expect(component.singleValue(rows[1], 10)).toBe(103);
  });
});
