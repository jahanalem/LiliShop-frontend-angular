import { describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BasketSummaryComponent } from './basket-summary.component';
import { IBasketItem } from 'src/app/shared/models/basket';

describe('BasketSummaryComponent', () => {
  async function setup(items: IBasketItem[]) {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, BasketSummaryComponent]
    }).compileComponents();

    const fixture: ComponentFixture<BasketSummaryComponent> = TestBed.createComponent(BasketSummaryComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the SKU and the selected variant attributes for a basket line (Test 5)', async () => {
    const item: IBasketItem = {
      id: 40,
      productName: 'Cargo Shorts',
      price: 29.99,
      quantity: 4,
      pictureUrl: 'pic.jpg',
      brand: 'B',
      type: 'Shorts',
      productVariantId: 500,
      sku: 'P40-BROWN-M',
      variantDescription: 'Size: M · Color: Brown'
    };

    const fixture = await setup([item]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('P40-BROWN-M');            // SKU
    expect(text).toContain('Size: M · Color: Brown');  // defining/descriptive attributes
    expect(text).toContain('Cargo Shorts');
  });
});
