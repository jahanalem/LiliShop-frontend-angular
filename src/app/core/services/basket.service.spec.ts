import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BasketService } from './basket.service';
import { StorageService } from './storage.service';
import { IProduct } from 'src/app/shared/models/product';
import { IBasketVariantSelection } from 'src/app/shared/models/basket';
import { environment } from 'src/environments/environment';

describe('BasketService', () => {
  let service: BasketService;
  let httpMock: HttpTestingController;

  const product = { id: 40, name: 'Cargo Shorts', price: 29.99, pictureUrl: 'pic.jpg', productBrand: 'B', productType: 'Shorts' } as unknown as IProduct;
  const brownM: IBasketVariantSelection = { id: 500, sku: 'P40-BROWN-M', price: 29.99, description: 'Size: M · Color: Brown' };
  const brownL: IBasketVariantSelection = { id: 501, sku: 'P40-BROWN-L', price: 29.99, description: 'Size: L · Color: Brown' };

  const basketUrl = `${environment.apiUrl}basket`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BasketService,
        { provide: StorageService, useValue: { set: vi.fn(), get: vi.fn(), delete: vi.fn() } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(BasketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  /** Echo the POSTed basket back, exactly as the (fixed) server does — variant identity preserved. */
  function flushSetBasketEchoingRequest(): void {
    const req = httpMock.expectOne(r => r.method === 'POST' && r.url === basketUrl);
    req.flush(req.request.body);
  }

  it('merges the same variant added twice into a single line (Test 1)', () => {
    service.addItemToBasket(product, 4, brownM);
    flushSetBasketEchoingRequest();

    service.addItemToBasket(product, 4, brownM);
    flushSetBasketEchoingRequest();

    const items = service.getCurrentBasketValue()!.items;
    expect(items.length).toBe(1);
    expect(items[0].productVariantId).toBe(500);
    expect(items[0].quantity).toBe(8);
    expect(items[0].sku).toBe('P40-BROWN-M');
  });

  it('keeps different variants of the same product as separate lines (Test 2)', () => {
    service.addItemToBasket(product, 1, brownM);
    flushSetBasketEchoingRequest();

    service.addItemToBasket(product, 1, brownL);
    flushSetBasketEchoingRequest();

    const items = service.getCurrentBasketValue()!.items;
    expect(items.length).toBe(2);
    expect(items.map(i => i.productVariantId).sort()).toEqual([500, 501]);
  });

  it('rolls back when the server rejects an over-stock quantity increase (Test 4)', () => {
    // Seed a basket with Brown-M ×4.
    service.addItemToBasket(product, 4, brownM);
    flushSetBasketEchoingRequest();
    const before = service.getCurrentBasketValue()!;
    expect(before.items[0].quantity).toBe(4);

    // Try to bump it to 5 — the server refuses (only 4 in stock, ProblemDetails 400).
    service.incrementItemQuantity(before.items[0]);
    const req = httpMock.expectOne(r => r.method === 'POST' && r.url === basketUrl);
    req.flush({ detail: "Only 4 of 'P40-BROWN-M' are available." }, { status: 400, statusText: 'Bad Request' });

    const after = service.getCurrentBasketValue()!;
    expect(after.items[0].quantity).toBe(4); // rolled back on screen, not 5 (server never stored it)
  });

  afterEach(() => httpMock.verify());
});
