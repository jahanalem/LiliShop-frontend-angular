import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ShopComponent } from './shop.component';
import { ShopService } from 'src/app/core/services/shop.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { ShopParams } from 'src/app/shared/models/productQueryParams';
import { of } from 'rxjs';
import { IProductPagination } from 'src/app/shared/models/pagination';

describe('ShopComponent', () => {
  let component: ShopComponent;
  let fixture: ComponentFixture<ShopComponent>;
  let shopService: ShopService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ShopComponent],
      providers: [ShopService],
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
    spyOn(component, 'getProducts');
    component.ngOnInit();
    expect(component.getProducts).toHaveBeenCalled();
  });

  it('should call getFilters() on init', () => {
    spyOn(component, 'getFilters');
    component.ngOnInit();
    expect(component.getFilters).toHaveBeenCalled();
  });

  it('should call getProducts() with useCache=true when onPageChanged is called', () => {
    spyOn(component, 'getProducts');
    component.onPageChanged(2);
    expect(component.getProducts).toHaveBeenCalledWith(true);
  });

  it('should reset search term, shopParams, and call getProducts() when onReset is called', () => {
    component.searchTerm = new ElementRef(document.createElement('input'));
    component.searchTerm.nativeElement.value = 'test';
    spyOn(component, 'getProducts');
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
    spyOn(shopService, 'getProducts').and.returnValue(of(dummyPagination));
    component.getProducts();
    expect(shopService.getProducts).toHaveBeenCalled();
  });

  it('should call shopService.getBrands(), getTypes(), and getSizes() when getFilters() is called', () => {
    spyOn(shopService, 'getBrands').and.returnValue(of([]));
    spyOn(shopService, 'getTypes').and.returnValue(of([]));
    spyOn(shopService, 'getSizes').and.returnValue(of([]));
    component.getFilters();
    expect(shopService.getBrands).toHaveBeenCalled();
    expect(shopService.getTypes).toHaveBeenCalled();
    expect(shopService.getSizes).toHaveBeenCalled();
  });

  it('should update shopParams and call getProducts() when onFilterSelected() is called', () => {
    const testFilterValue = 1;
    spyOn(component, 'getProducts');
    component.onFilterSelected({ value: testFilterValue.toString() } as HTMLSelectElement, 'brand');
    expect(component.shopParams.brandId).toBe(testFilterValue);
    expect(component.getProducts).toHaveBeenCalled();
  });
});
