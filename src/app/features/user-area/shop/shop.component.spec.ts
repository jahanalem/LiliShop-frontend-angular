import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ShopComponent } from './shop.component';
import { ProductService } from 'src/app/core/services/product.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef, signal } from '@angular/core';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { of } from 'rxjs';
import { ProductPagination } from 'src/app/shared/models/pagination';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('ShopComponent', () => {
    let component: ShopComponent;
    let fixture: ComponentFixture<ShopComponent>;
    let productService: ProductService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ShopComponent],
            providers: [ProductService, provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
        }).compileComponents();

        productService = TestBed.inject(ProductService);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ShopComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getProducts() on init', () => {
        vi.spyOn(component, 'getProducts').mockResolvedValue(undefined);
        component.ngOnInit();
        expect(component.getProducts).toHaveBeenCalled();
    });

    it('should call getFilters() on init', () => {
        vi.spyOn(component, 'getFilters').mockResolvedValue(undefined);
        component.ngOnInit();
        expect(component.getFilters).toHaveBeenCalled();
    });

    it('should call getProducts() when onPageChanged is called', () => {
        vi.spyOn(component, 'getProducts').mockResolvedValue(undefined);
        component.onPageChanged({ pageNumber: 2, pageSize: 10 });
        expect(component.getProducts).toHaveBeenCalled();
    });

    it('should reset search term, shopParams, and call getProducts() when onReset is called', () => {
        const mockElementRef = new ElementRef(document.createElement('input'));
        Object.defineProperty(component, 'searchTerm', { value: signal(mockElementRef) });
        component.searchTerm().nativeElement.value = 'test';
        vi.spyOn(component, 'getProducts').mockResolvedValue(undefined);
        component.onReset();
        expect(component.searchTerm().nativeElement.value).toBe('');
        expect(component.shopParams()).toEqual(new ProductQueryParams());
        expect(component.getProducts).toHaveBeenCalled();
    });

    it('should call productService.getProducts() when getProducts() is called', () => {
        const dummyPagination: ProductPagination = {
            pageIndex: 1,
            pageSize: 5,
            count: 0,
            data: []
        };
        vi.spyOn(productService, 'getProducts').mockReturnValue(of(dummyPagination));
        component.getProducts();
        expect(productService.getProducts).toHaveBeenCalled();
    });

    it('should call productService.getBrands(), getTypes(), and getSizes() when getFilters() is called', () => {
        vi.spyOn(productService, 'getBrands').mockReturnValue(of([]));
        vi.spyOn(productService, 'getTypes').mockReturnValue(of([]));
        vi.spyOn(productService, 'getSizes').mockReturnValue(of([]));
        component.getFilters();
        expect(productService.getBrands).toHaveBeenCalled();
        expect(productService.getTypes).toHaveBeenCalled();
        expect(productService.getSizes).toHaveBeenCalled();
    });

    it('should update shopParams and call getProducts() when onFilterSelected() is called', () => {
        const testFilterValue = 1;
        vi.spyOn(component, 'getProducts').mockResolvedValue(undefined);
        component.onFilterSelected(testFilterValue, 'brand');
        expect(component.getProducts).toHaveBeenCalled();
    });
});
