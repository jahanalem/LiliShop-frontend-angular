import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ShopComponent implements OnInit {
  searchTerm = viewChild.required<ElementRef<HTMLInputElement>>('search');

  private productService = inject(ProductService);

  products   = signal<IProduct[]>([]);
  brands     = signal<IBrand[]>([]);
  types      = signal<IProductType[]>([]);
  sizes      = signal<ISizeClassification[]>([]);
  shopParams = signal<ProductQueryParams>({} as ProductQueryParams);
  totalCount = signal<number>(0);

  cols           = signal<number>(3);
  isMobileScreen = signal<boolean>(false);
  filtersHidden  = signal<boolean>(true);

  readonly sortOptions = [
    { name: 'Alphabetical', value: 'name' },
    { name: 'Price: Low to high', value: 'priceAsc' },
    { name: 'Price: High to low', value: 'priceDesc' },
  ];

  readonly saleOptions = [
    { name: 'All Products', value: 'all' },
    { name: 'Only Sale Products', value: 'sale' },
    { name: 'Non-Sale Products', value: 'nonSale' },
  ];

  constructor() {
    this.shopParams.set(this.productService.getShopParams());
  }

  async ngOnInit(): Promise<void> {
    this.checkScreenSize();
    await Promise.all([
      await this.getProducts(true),
      await this.getFilters()
    ]);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const width = event.target.innerWidth;
    const wasMobile = this.isMobileScreen();
    const isNowMobile = width <= 992;

    this.isMobileScreen.set(isNowMobile);
    // Only update filtersHidden if the mobile/desktop mode *changes*
    // This prevents keyboard appearance on mobile from closing an open filter panel.
    if (wasMobile !== isNowMobile) {
      if (isNowMobile) {
        this.filtersHidden.set(true);
      } else {
        this.filtersHidden.set(false);
      }
    }
  }

  checkScreenSize() {
    const width = window.innerWidth;
    const isNowMobile = width <= 992;
    this.isMobileScreen.set(isNowMobile);

    if (isNowMobile) {
      this.filtersHidden.set(true);
    } else {
      this.filtersHidden.set(false);
    }
  }

  toggleFilters() {
    this.filtersHidden.set(!this.filtersHidden());
  }

  // getProducts method
  async getProducts(isActive?: boolean): Promise<void> {
    try {
      const response = await firstValueFrom(this.productService.getProducts(isActive));
      if (response) {
        this.products.set(response.data);
        this.totalCount.set(response.count);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // getFilters method
  async getFilters(): Promise<void> {
    try {
      const [brands, types, sizes] = await Promise.all([
        firstValueFrom(this.productService.getBrands(true)),
        firstValueFrom(this.productService.getTypes(true)),
        firstValueFrom(this.productService.getSizes(true)),
      ]);

      this.brands.set([{ id: 0, name: 'All Brands' }, ...brands]);
      this.types.set([{ id: 0, name: 'All Types' }, ...types]);
      this.sizes.set([{ id: 0, size: 'All Sizes', isActive: false }, ...sizes]);
    } catch (error) {
      console.error(error);
    }
  }

  // onPageChanged method
  async onPageChanged(event: { pageNumber: number, pageSize: number }): Promise<void> {
    const params = this.shopParams();
    if (params.pageNumber === event.pageNumber && params.pageSize === event.pageSize) {
      console.log("prevent redundant calls.");
      return;
    }
    params.pageNumber = event.pageNumber;
    params.pageSize = event.pageSize;
    this.shopParams.set(params);

    await this.getProducts();

    requestAnimationFrame(() => {
      try {
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        console.debug('Scroll method failed:', e);
      }
    });
  }

  // onSearch method
  async onSearch(): Promise<void> {
    const params = this.productService.getShopParams();
    params.search = this.searchTerm().nativeElement.value || '';
    params.pageNumber = 1;
    this.productService.setShopParams(params);
    await this.getProducts();
  }

  // This method clears the search input AND resets all shopParams in the service to new ProductQueryParams()
  async onReset(): Promise<void> {
    if (this.searchTerm()) {
      this.searchTerm().nativeElement.value = '';
    }
    const defaultParams = new ProductQueryParams();
    this.shopParams.set(defaultParams);
    this.productService.setShopParams(defaultParams);
    this.productService.clearProductCache();
    await this.getProducts();
    if (this.isMobileScreen()) {
      this.filtersHidden.set(true);
    }
  }

  async onFilterSelected(filterValue: any | null, filterType: string): Promise<void> {
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
      case 'sale':
        params.sale = filterValue;
        break;
      default:
        break;
    }

    params.pageNumber = 1;
    this.productService.setShopParams(params);
    await this.getProducts();
  }
}
