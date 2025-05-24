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

  products   = signal<IProduct[]>([]);
  brands     = signal<IBrand[]>([]);
  types      = signal<IProductType[]>([]);
  sizes      = signal<ISizeClassification[]>([]);
  shopParams = signal<ProductQueryParams>({} as ProductQueryParams);
  totalCount = signal<number>(0);

  cols           = signal<number>(3);
  isMobileScreen = signal<boolean>(false);
  filtersHidden  = signal<boolean>(false);

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

  private productService = inject(ProductService);

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
    this.updateFilterVisibility(width);
    this.isMobileScreen.set(width <= 992);
  }

  checkScreenSize() {
    const width = window.innerWidth;
    this.isMobileScreen.set(width <= 992);
    this.updateFilterVisibility(width);
  }

  toggleFilters() {
    this.filtersHidden.set(!this.filtersHidden());
  }

  private updateFilterVisibility(width: number) {
    if (width <= 992) {
      this.filtersHidden.set(true); // Filters hidden by default on mobile/tablet
    } else {
      this.filtersHidden.set(false); // Filters shown by default on desktop
    }
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
    params.pageNumber = event.pageNumber;
    params.pageSize = event.pageSize;
    this.shopParams.set(params);

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    await this.getProducts();
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
    this.shopParams.set(new ProductQueryParams());
    this.productService.setShopParams(this.shopParams());
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
