import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { VariantStockDialogComponent } from './variant-stock-dialog.component';
import { InventoryService } from 'src/app/core/services/inventory.service';

describe('VariantStockDialogComponent', () => {
  let component: VariantStockDialogComponent;
  let fixture: ComponentFixture<VariantStockDialogComponent>;
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let inventoryServiceMock: {
    adjust: ReturnType<typeof vi.fn>;
    getTransactions: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dialogRefMock = { close: vi.fn() };
    inventoryServiceMock = {
      adjust: vi.fn().mockReturnValue(of({ id: 1, productVariantId: 7, quantityOnHand: 12, quantityReserved: 0 })),
      getTransactions: vi.fn().mockReturnValue(of({
        pageIndex: 1, pageSize: 10, count: 1,
        data: [{ id: 1, productVariantId: 7, delta: 10, type: 'Receive', reason: 'Initial stock' }]
      }))
    };

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, VariantStockDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { variantId: 7, sku: 'P42-M', quantityOnHand: 10 } },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VariantStockDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the current stock and loads the history', () => {
    expect(component.quantityOnHand()).toBe(10);
    expect(inventoryServiceMock.getTransactions).toHaveBeenCalledWith(7, 1, 10);
    expect(component.transactions().length).toBe(1);
  });

  it('requires a delta and a reason before applying', () => {
    component.delta = null;
    component.reason = 'recount';
    expect(component.canApply).toBe(false);

    component.delta = 5;
    component.reason = ' ';
    expect(component.canApply).toBe(false);

    component.reason = 'recount';
    expect(component.canApply).toBe(true);
  });

  it('applies an adjustment, updates the quantity, and reloads history', () => {
    component.delta = 2;
    component.reason = 'recount';

    component.apply();

    expect(inventoryServiceMock.adjust).toHaveBeenCalledWith(7, 2, 'recount');
    expect(component.quantityOnHand()).toBe(12);
    expect(inventoryServiceMock.getTransactions).toHaveBeenCalledTimes(2);
  });

  it('closes with the new quantity after a change, undefined otherwise', () => {
    component.close();
    expect(dialogRefMock.close).toHaveBeenLastCalledWith(undefined);

    component.delta = 2;
    component.reason = 'recount';
    component.apply();
    component.close();
    expect(dialogRefMock.close).toHaveBeenLastCalledWith(12);
  });

  it('surfaces a server rejection without changing the quantity', () => {
    inventoryServiceMock.adjust.mockReturnValue(
      throwError(() => ({ error: { message: 'The adjustment would push available stock below zero.' } })));
    component.delta = -99;
    component.reason = 'oops';

    component.apply();

    expect(component.quantityOnHand()).toBe(10);
    expect(component.errorMessage()).toContain('below zero');
  });
});
