
import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductService } from 'src/app/core/services/product.service';
import { IBrand } from 'src/app/shared/models/brand';
import { IProduct } from 'src/app/shared/models/product';
import { ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { IProductType } from 'src/app/shared/models/productType';


@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopComponent implements OnInit {
  searchTerm = viewChild.required<ElementRef<HTMLInputElement>>('search');

  products   = signal<IProduct[]>([]);
  brands     = signal<IBrand[]>([]);
  types      = signal<IProductType[]>([]);
  sizes      = signal<ISizeClassification[]>([]);
  shopParams = signal<ProductQueryParams>({} as ProductQueryParams);
  totalCount = signal<number>(0);

  readonly sortOptions = [
    { name: 'Alphabetical', value: 'name' },
    { name: 'Price: Low to high', value: 'priceAsc' },
    { name: 'Price: High to low', value: 'priceDesc' },
  ]

  private productService = inject(ProductService);

  constructor() {
    this.shopParams.set(this.productService.getShopParams());
  }

  ngOnInit(): void {
    this.getProducts(true);
    this.getFilters();
  }

  getProducts(isActive?: boolean): void {
    this.productService.getProducts(isActive).subscribe({
      next: (response) => {
        if (response) {
          this.products.set(response.data);
          this.totalCount.set(response.count);
        }
      },
      error: (error) => { console.error(error); }
    });
  }

  getFilters(): void {
    this.getData(this.productService.getBrands(true), (response) => {
      this.brands.set([{ id: 0, name: 'All' }, ...response]);
    });

    this.getData(this.productService.getTypes(true), (response) => {
      this.types.set([{ id: 0, name: 'All' }, ...response]);
    });

    this.getData(this.productService.getSizes(true), (response) => {
      this.sizes.set([{ id: 0, size: 'All', isActive: false }, ...response]);
    });
  }

  onPageChanged(event: number): void {
    const params = this.productService.getShopParams();
    if (params.pageNumber !== event) {
      params.pageNumber = event;
      this.getProducts(true);
    }
  }

  onSearch(): void {
    const params = this.productService.getShopParams();
    params.search = this.searchTerm().nativeElement.value;
    params.pageNumber = 1;
    this.productService.setShopParams(params);
    this.getProducts();
  }

  onReset(): void {
    this.searchTerm().nativeElement.value = '';
    this.shopParams.set(new ProductQueryParams());
    this.productService.setShopParams(this.shopParams());
    this.getProducts();
  }

  onFilterSelected(inputElement: EventTarget | null, filterType: string): void {
    if (!inputElement) {
      return;
    }

    const selectElement = inputElement as HTMLSelectElement;
    const filterValue = +selectElement.value;
    const params = this.productService.getShopParams();

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
    this.productService.setShopParams(params);
    this.getProducts();
  }

  private getData<T>(apiCall: Observable<T>, successCallback: (response: T) => void): void {
    apiCall.subscribe({
      next: successCallback,
      error: (error) => {
        console.error(error);
      }
    });
  }
}
