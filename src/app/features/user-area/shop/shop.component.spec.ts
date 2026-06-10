import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ShopComponent } from './shop.component';
import { ShopService } from 'src/app/core/services/shop.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { ShopParams } from 'src/app/shared/models/productQueryParams';
import { of } from 'rxjs';
import { IProductPagination } from 'src/app/shared/models/pagination';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('ShopComponent', () => {
    let component: ShopComponent;
    let fixture: ComponentFixture<ShopComponent>;
    let shopService: ShopService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
    imports: [ShopComponent],
    providers: [ShopService, provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

        shopService = TestBed.inject(ShopService);
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
        vi.spyOn(component, 'getProducts').mockReturnValue(undefined);
        component.ngOnInit();
        expect(component.getProducts).toHaveBeenCalled();
    });

    it('should call getFilters() on init', () => {
        vi.spyOn(component, 'getFilters').mockReturnValue(undefined);
        component.ngOnInit();
        expect(component.getFilters).toHaveBeenCalled();
    });

    it('should call getProducts() with useCache=true when onPageChanged is called', () => {
        vi.spyOn(component, 'getProducts').mockReturnValue(undefined);
        component.onPageChanged(2);
        expect(component.getProducts).toHaveBeenCalledWith(true);
    });

    it('should reset search term, shopParams, and call getProducts() when onReset is called', () => {
        component.searchTerm = new ElementRef(document.createElement('input'));
        component.searchTerm.nativeElement.value = 'test';
        vi.spyOn(component, 'getProducts').mockReturnValue(undefined);
        component.onReset();
        expect(component.searchTerm.nativeElement.value).toBe('');
        expect(component.shopParams).toEqual(new ShopParams());
        expect(component.getProducts).toHaveBeenCalled();
    });

    it('should call shopService.getProducts() when getProducts() is called', () => {
        const dummyPagination: IProductPagination = {
            pageIndex: 1,
            pageSize: 5,
            count: 0,
            data: []
        };
        vi.spyOn(shopService, 'getProducts').mockReturnValue(of(dummyPagination));
        component.getProducts();
        expect(shopService.getProducts).toHaveBeenCalled();
    });

    it('should call shopService.getBrands(), getTypes(), and getSizes() when getFilters() is called', () => {
        vi.spyOn(shopService, 'getBrands').mockReturnValue(of([]));
        vi.spyOn(shopService, 'getTypes').mockReturnValue(of([]));
        vi.spyOn(shopService, 'getSizes').mockReturnValue(of([]));
        component.getFilters();
        expect(shopService.getBrands).toHaveBeenCalled();
        expect(shopService.getTypes).toHaveBeenCalled();
        expect(shopService.getSizes).toHaveBeenCalled();
    });

    it('should update shopParams and call getProducts() when onFilterSelected() is called', () => {
        const testFilterValue = 1;
        vi.spyOn(component, 'getProducts').mockReturnValue(undefined);
        component.onFilterSelected({ value: testFilterValue.toString() } as HTMLSelectElement, 'brand');
        expect(component.shopParams.brandId).toBe(testFilterValue);
        expect(component.getProducts).toHaveBeenCalled();
    });
});
