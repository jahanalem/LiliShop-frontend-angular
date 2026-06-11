import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductItemComponent } from './product-item.component';
import { BasketService } from 'src/app/core/services/basket.service';
import { IProduct } from 'src/app/shared/models/product';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { provideRouter } from '@angular/router';

describe('ProductItemComponent', () => {
    let component: ProductItemComponent;
    let fixture: ComponentFixture<ProductItemComponent>;
    let basketServiceSpy: MockedObject<BasketService>;

    beforeEach(async () => {
        const basketServiceMock = {
            addItemToBasket: vi.fn().mockName("BasketService.addItemToBasket")
        };

        await TestBed.configureTestingModule({
            imports: [ProductItemComponent],
            providers: [
                provideRouter([]),
                { provide: BasketService, useValue: basketServiceMock }
            ]
        })
            .compileComponents();

        basketServiceSpy = TestBed.inject(BasketService) as MockedObject<BasketService>;
    });

    const defaultProduct: IProduct = {
        id: 1,
        name: 'Test Product',
        price: 10,
        description: 'Test Description',
        pictureUrl: 'Test Picture Url',
        picturePublicId: 'Test Picture Public Id',
        productType: 'Test Product Type',
        productTypeId: 1,
        productBrand: 'Test Product Brand',
        productBrandId: 1,
        isActive: true,
        productCharacteristics: [],
        productPhotos: []
    };

    beforeEach(() => {
        fixture = TestBed.createComponent(ProductItemComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('product', defaultProduct);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the title of the product', () => {
        const product: IProduct = {
            id: 1,
            name: 'Test Product',
            price: 10,
            description: 'Test Description',
            pictureUrl: 'Test Picture Url',
            picturePublicId: 'Test Picture Public Id',
            productType: 'Test Product Type',
            productTypeId: 1,
            productBrand: 'Test Product Brand',
            productBrandId: 1,
            isActive: true,
            productCharacteristics: [],
            productPhotos: []
        };
        fixture.componentRef.setInput('product', product);
        fixture.detectChanges();
        const productTitleElement: DebugElement = fixture.debugElement.query(By.css('.product-title'));
        const textContent = productTitleElement.nativeElement.textContent;
        expect(textContent).toContain(product.name);
    });

    it('should call addItemToBasket on click', () => {
        const product: IProduct = {
            id: 1,
            name: 'Test Product',
            price: 10,
            description: 'Test Description',
            pictureUrl: 'Test Picture Url',
            picturePublicId: 'Test Picture Public Id',
            productType: 'Test Product Type',
            productTypeId: 1,
            productBrand: 'Test Product Brand',
            productBrandId: 1,
            isActive: true,
            productCharacteristics: [],
            productPhotos: []
        };
        fixture.componentRef.setInput('product', product);
        fixture.detectChanges();
        const addButton: DebugElement = fixture.debugElement.query(By.css('.add-to-cart-btn'));
        addButton.nativeElement.click();
        expect(basketServiceSpy.addItemToBasket).toHaveBeenCalledWith(product);
    });
});
