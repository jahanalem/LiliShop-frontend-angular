
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { fromEvent, Observable, Subscription } from 'rxjs';
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
export class ShopComponent implements OnInit, OnDestroy {
  searchTerm = viewChild.required<ElementRef<HTMLInputElement>>('search');

  products   = signal<IProduct[]>([]);
  brands     = signal<IBrand[]>([]);
  types      = signal<IProductType[]>([]);
  sizes      = signal<ISizeClassification[]>([]);
  shopParams = signal<ProductQueryParams>({} as ProductQueryParams);
  totalCount = signal<number>(0);

  rowHeight      = signal<string>("1:1.4");  // Default for desktop
  cols           = signal<number>(3);
  isMobileScreen = signal<boolean>(false);
  filtersHidden  = signal<boolean>(false);

  resizeSubscription: Subscription | null = null;

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
    this.checkScreenSize();

    // Listen to window resize events
    this.resizeSubscription = fromEvent(window, 'resize').subscribe(() => {
      this.checkScreenSize();
    });

    this.getProducts(true);
    this.getFilters();
  }
  checkScreenSize() {
    const width = window.innerWidth;
    this.isMobileScreen.set(width <= 768);
  }
  ngOnDestroy() {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateFilterVisibility(event.target.innerWidth);
    this.updateGridHeight(event.target.innerWidth);
  }
  toggleFilters() {
    this.filtersHidden.set(!this.filtersHidden());
  }
  private updateFilterVisibility(width: number) {
    if (width < 768) {
      this.filtersHidden.set(true);
    } else {
      this.filtersHidden.set(false);
    }
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

  onPageChanged(event: { pageNumber: number, pageSize: number }) {
    const params = this.shopParams();
    params.pageNumber = event.pageNumber;
    params.pageSize = event.pageSize;
    this.shopParams.set(params);
    this.getProducts();
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

  onFilterSelected(filterValue: any | null, filterType: string): void {
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
        params.sort = filterValue;
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

  updateGridHeight(width: number) {
    if (width >= 320 && width<=330) {
      this.rowHeight.set('1:1.4');
      this.cols.set(1);
    }
    else if (width <= 576) {
      this.rowHeight.set('1:1');
      this.cols.set(1);
    } else if (width <= 768) {
      this.rowHeight.set('1:1.4');
      this.cols.set(2);
    }
    else if(width<=1199){
       this.rowHeight.set('1:1.4');
       this.cols.set(2);
    }
    else {
      this.rowHeight.set('1:1.4');
      this.cols.set(3);
    }
  }
}
