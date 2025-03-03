
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
  ]

  private productService = inject(ProductService);

  constructor() {
    this.shopParams.set(this.productService.getShopParams());
  }

  async ngOnInit(): Promise<void> {
    this.checkScreenSize();
    await Promise.all([
      await this.getProducts(true),
      await this.getFilters()
    ])
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const width = event.target.innerWidth;
    this.updateFilterVisibility(width);
    this.isMobileScreen.set(width <= 768);
  }

  checkScreenSize() {
    const width = window.innerWidth;
    this.isMobileScreen.set(width <= 768);
    this.updateFilterVisibility(width);
  }

  toggleFilters() {
    this.filtersHidden.set(!this.filtersHidden());
  }

  private updateFilterVisibility(width: number) {
    if (width <= 768) {
      this.filtersHidden.set(true);
    } else {
      this.filtersHidden.set(false);
    }
  }

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

  async getFilters(): Promise<void> {
    try {
      const [brands, types, sizes] = await Promise.all([
        firstValueFrom(this.productService.getBrands(true)),
        firstValueFrom(this.productService.getTypes(true)),
        firstValueFrom(this.productService.getSizes(true)),
      ]);
      this.brands.set([{ id: 0, name: 'All' }, ...brands]);
      this.types.set([{ id: 0, name: 'All' }, ...types]);
      this.sizes.set([{ id: 0, size: 'All', isActive: false }, ...sizes]);
    } catch (error) {
      console.error(error);
    }
  }

  async onPageChanged(event: { pageNumber: number, pageSize: number }): Promise<void> {
    const params = this.shopParams();
    params.pageNumber = event.pageNumber;
    params.pageSize = event.pageSize;
    this.shopParams.set(params);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    await this.getProducts();
  }

  async onSearch(): Promise<void> {
    const params = this.productService.getShopParams();
    params.search = this.searchTerm().nativeElement.value;
    params.pageNumber = 1;
    this.productService.setShopParams(params);
    await this.getProducts();
  }

  async onReset(): Promise<void> {
    this.searchTerm().nativeElement.value = '';
    this.shopParams.set(new ProductQueryParams());
    this.productService.setShopParams(this.shopParams());
    this.productService.clearProductCache();
    await this.getProducts();
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
      default:
        break;
    }

    params.pageNumber = 1;
    this.productService.setShopParams(params);
    await this.getProducts();
  }
}
