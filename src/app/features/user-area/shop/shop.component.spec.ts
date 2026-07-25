import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShopComponent } from './shop.component';
import { ProductService } from 'src/app/core/services/product.service';
import { ProductAttributeService } from 'src/app/core/services/product-attribute.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { of } from 'rxjs';
import { ProductPagination } from 'src/app/shared/models/pagination';
import { IProductAttribute } from 'src/app/shared/models/productAttribute';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('ShopComponent', () => {
    let component: ShopComponent;
    let fixture: ComponentFixture<ShopComponent>;
    let productService: ProductService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ShopComponent],
            providers: [ProductService, provideRouter([]), provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
        }).compileComponents();

        productService = TestBed.inject(ProductService);
    });

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

    it('should call getFilters() on init', async () => {
        vi.spyOn(component, 'getProducts').mockResolvedValue(undefined);
        vi.spyOn(component, 'getFilters').mockResolvedValue(undefined);
        await component.ngOnInit();
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

    it('should load brands, types, and filterable attributes when getFilters() is called', () => {
        const attributeService = TestBed.inject(ProductAttributeService);
        vi.spyOn(productService, 'getBrands').mockReturnValue(of([]));
        vi.spyOn(productService, 'getTypes').mockReturnValue(of([]));
        vi.spyOn(attributeService, 'getAllAttributes').mockReturnValue(of([]));
        component.getFilters();
        expect(productService.getBrands).toHaveBeenCalled();
        expect(productService.getTypes).toHaveBeenCalled();
        expect(attributeService.getAllAttributes).toHaveBeenCalledWith(true);
    });

    it('should update shopParams and call getProducts() when onFilterSelected() is called', () => {
        const testFilterValue = 1;
        vi.spyOn(component, 'getProducts').mockResolvedValue(undefined);
        component.onFilterSelected(testFilterValue, 'brand');
        expect(component.getProducts).toHaveBeenCalled();
    });

    describe('filter state survives leaving and returning to the shop page', () => {
        // Reported bug: pick "Color: Red", open a product, come back — the results were still
        // filtered (the applied params live in ProductService and survive navigation) but the Red
        // checkbox had lost its tick, because the checkbox model was a separate component-local
        // copy that was recreated empty. Router navigation to product details and browser Back both
        // destroy and rebuild ShopComponent while the service instance survives, so recreating the
        // component against the same injector reproduces both cases exactly.

        const COLOR_ATTR = 20, RED = 202, YELLOW = 201;
        const SIZE_ATTR = 10, SIZE_M = 101;

        const colorAttr: IProductAttribute = {
            id: COLOR_ATTR, code: 'color', name: 'Color', inputType: 'MultiSelect', swatchType: 'ColorHex',
            isFilterable: true, displayOrder: 10, isActive: true,
            values: [
                { id: YELLOW, productAttributeId: COLOR_ATTR, code: 'yellow', name: 'Yellow', colorHex: '#FFD700', sortOrder: 10, isActive: true },
                { id: RED, productAttributeId: COLOR_ATTR, code: 'red', name: 'Red', colorHex: '#D32F2F', sortOrder: 20, isActive: true }
            ]
        };
        const sizeAttr: IProductAttribute = {
            id: SIZE_ATTR, code: 'size', name: 'Size', inputType: 'Select', swatchType: 'None',
            isFilterable: true, displayOrder: 20, isActive: true,
            values: [{ id: SIZE_M, productAttributeId: SIZE_ATTR, code: 'm', name: 'M', sortOrder: 30, isActive: true }]
        };

        const emptyPage: ProductPagination = { pageIndex: 1, pageSize: 10, count: 0, data: [] };

        beforeEach(() => {
            const attributeService = TestBed.inject(ProductAttributeService);
            vi.spyOn(productService, 'getProducts').mockReturnValue(of(emptyPage));
            vi.spyOn(productService, 'getBrands').mockReturnValue(of([]));
            vi.spyOn(productService, 'getTypes').mockReturnValue(of([]));
            vi.spyOn(attributeService, 'getAllAttributes').mockReturnValue(of([colorAttr, sizeAttr]));
        });

        /**
         * Mounts the shop page the way the router does: a fresh component against the same service
         * instance. getFilters() is awaited explicitly because ngOnInit's promise chain is not
         * tracked by whenStable() under zoneless change detection — in the browser the facet
         * attributes simply arrive a tick later and the derived checkbox state re-renders then.
         */
        async function visitShop(): Promise<ComponentFixture<ShopComponent>> {
            const shopFixture = TestBed.createComponent(ShopComponent);
            shopFixture.detectChanges();
            await shopFixture.componentInstance.getFilters();
            shopFixture.detectChanges();
            return shopFixture;
        }

        function checkboxStates(shopFixture: ComponentFixture<ShopComponent>): boolean[] {
            return Array.from(
                shopFixture.nativeElement.querySelectorAll('.facet-values input[type="checkbox"]')
            ).map((input: any) => input.checked);
        }

        it('keeps the facet checked after navigating to product details and back', async () => {
            const first = await visitShop();
            await first.componentInstance.toggleFacetValue(COLOR_ATTR, RED);
            first.detectChanges();
            expect(first.componentInstance.isFacetSelected(COLOR_ATTR, RED)).toBe(true);

            // Leave for the product details page.
            first.destroy();

            // ...and come back (router navigation or browser Back — same lifecycle).
            const second = await visitShop();

            expect(second.componentInstance.isFacetSelected(COLOR_ATTR, RED)).toBe(true);
            expect(checkboxStates(second)).toContain(true);
        });

        it('keeps the applied params, the results request and the checkbox in agreement', async () => {
            const first = await visitShop();
            await first.componentInstance.toggleFacetValue(COLOR_ATTR, RED);
            first.destroy();

            const second = await visitShop();

            // One source of truth: what was requested, what is stored, and what is ticked all match.
            expect(productService.getShopParams().attrValues).toEqual([`${RED}`]);
            expect(second.componentInstance.shopParams().attrValues).toEqual([`${RED}`]);
            expect(second.componentInstance.selectedFacets()).toEqual({ [COLOR_ATTR]: [RED] });
        });

        it('restores several facets across different attributes', async () => {
            const first = await visitShop();
            await first.componentInstance.toggleFacetValue(COLOR_ATTR, RED);
            await first.componentInstance.toggleFacetValue(COLOR_ATTR, YELLOW);
            await first.componentInstance.toggleFacetValue(SIZE_ATTR, SIZE_M);
            first.destroy();

            const second = await visitShop();

            expect(second.componentInstance.isFacetSelected(COLOR_ATTR, RED)).toBe(true);
            expect(second.componentInstance.isFacetSelected(COLOR_ATTR, YELLOW)).toBe(true);
            expect(second.componentInstance.isFacetSelected(SIZE_ATTR, SIZE_M)).toBe(true);
            expect(checkboxStates(second).filter(Boolean).length).toBe(3);
        });

        it('restores the other filter controls and the search box too', async () => {
            const first = await visitShop();
            await first.componentInstance.onFilterSelected(3, 'brand');
            await first.componentInstance.onFilterSelected(2, 'type');
            await first.componentInstance.onFilterSelected('priceAsc', 'sort');
            await first.componentInstance.onFilterSelected('sale', 'sale');
            first.componentInstance.searchTerm().nativeElement.value = 'shirt';
            await first.componentInstance.onSearch();
            first.destroy();

            const second = await visitShop();
            const restored = second.componentInstance.shopParams();

            expect(restored.brandId).toBe(3);
            expect(restored.typeId).toBe(2);
            expect(restored.sort).toBe('priceAsc');
            expect(restored.sale).toBe('sale');
            expect(restored.search).toBe('shirt');
            // The search box is rendered from the same params rather than left blank.
            expect(second.componentInstance.searchTerm().nativeElement.value).toBe('shirt');
        });

        it('unticks a facet when it is toggled off, without touching the others', async () => {
            const shopFixture = await visitShop();
            await shopFixture.componentInstance.toggleFacetValue(COLOR_ATTR, RED);
            await shopFixture.componentInstance.toggleFacetValue(SIZE_ATTR, SIZE_M);

            await shopFixture.componentInstance.toggleFacetValue(COLOR_ATTR, RED);
            shopFixture.detectChanges();

            expect(shopFixture.componentInstance.isFacetSelected(COLOR_ATTR, RED)).toBe(false);
            expect(shopFixture.componentInstance.isFacetSelected(SIZE_ATTR, SIZE_M)).toBe(true);
            expect(productService.getShopParams().attrValues).toEqual([`${SIZE_M}`]);
        });

        it('clears every facet on reset, and the cleared state also survives a revisit', async () => {
            const first = await visitShop();
            await first.componentInstance.toggleFacetValue(COLOR_ATTR, RED);
            await first.componentInstance.onReset();
            first.detectChanges();

            expect(first.componentInstance.isFacetSelected(COLOR_ATTR, RED)).toBe(false);
            expect(checkboxStates(first).some(Boolean)).toBe(false);

            first.destroy();
            const second = await visitShop();
            expect(second.componentInstance.isFacetSelected(COLOR_ATTR, RED)).toBe(false);
        });
    });
});
