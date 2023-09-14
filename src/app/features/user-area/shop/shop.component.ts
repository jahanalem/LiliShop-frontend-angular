
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductService } from 'src/app/core/services/product.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { IBrand } from 'src/app/shared/models/brand';
import { IProduct } from 'src/app/shared/models/product';
import { ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { IType } from 'src/app/shared/models/productType';
import { ShopParams } from 'src/app/shared/models/shopParams';


@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
  // { static: true } needs to be set when you want to access the ViewChild in ngOnInit.
  // { static: false } can only be accessed in ngAfterViewInit. This is also what you want to go for when you have a structural directive (i.e. *ngIf) on your element in your template.
  @ViewChild('search', { static: false }) searchTerm!: ElementRef;
  products: IProduct[] = [];
  brands: IBrand[] = [];
  types: IType[] = [];
  sizes: ISizeClassification[] = [];
  shopParams: ShopParams;
  totalCount: number = 0;
  readonly sortOptions = [
    { name: 'Alphabetical', value: 'name' },
    { name: 'Price: Low to high', value: 'priceAsc' },
    { name: 'Price: High to low', value: 'priceDesc' },
  ]

  constructor(private shopService: ShopService, private productService: ProductService) {
    this.shopParams = this.shopService.getShopParams();
  }

  ngOnInit(): void {
    this.getProducts(false);
    this.getFilters();
  }

  getProducts(useCache = false, isActive?: boolean): void {
    this.productService.getProducts(useCache, isActive).subscribe({
      next: (response) => {
        if (response) {
          this.products = response.data;
          this.totalCount = response.count;
        }
      },
      error: (error) => { console.log(error); }
    });
  }

  getFilters(): void {
    this.getData(this.productService.getBrands(true), (response) => {
      this.brands = [{ id: 0, name: 'All' }, ...response];
    });

    this.getData(this.productService.getTypes(true), (response) => {
      this.types = [{ id: 0, name: 'All' }, ...response];
    });

    this.getData(this.productService.getSizes(true), (response) => {
      this.sizes = [{ id: 0, size: 'All', isActive: false }, ...response];
    });
  }

  onPageChanged(event: number): void {
    const params = this.shopService.getShopParams();
    if (params.pageNumber !== event) {
      params.pageNumber = event;
      this.getProducts(true);
    }
  }

  onSearch(): void {
    const params = this.shopService.getShopParams();
    params.search = this.searchTerm.nativeElement.value;
    params.pageNumber = 1;
    this.shopService.setShopParams(params);
    this.getProducts();
  }

  onReset(): void {
    this.searchTerm.nativeElement.value = '';
    this.shopParams = new ShopParams();
    this.shopService.setShopParams(this.shopParams);
    this.getProducts();
  }

  onFilterSelected(inputElement: EventTarget | null, filterType: string): void {
    if (!inputElement) {
      return;
    }

    const selectElement = inputElement as HTMLSelectElement;
    const filterValue = +selectElement.value;
    const params = this.shopService.getShopParams();

    switch (filterType) {
      case 'size':
        params.sizeId = filterValue;
        break;
      case 'brand':
        params.brandId = filterValue;
        break;
      case 'type':
        params.typeId = filterValue;
        break;
      case 'sort':
        params.sort = selectElement.value;
        break;
      default:
        break;
    }

    params.pageNumber = 1;
    this.shopService.setShopParams(params);
    this.getProducts();
  }

  private getData<T>(apiCall: Observable<T>, successCallback: (response: T) => void): void {
    apiCall.subscribe({
      next: successCallback,
      error: (error) => {
        console.log(error);
      }
    });
  }
}
