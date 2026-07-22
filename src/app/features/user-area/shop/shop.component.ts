import { PagingHeaderComponent } from 'src/app/shared/components/paging-header/paging-header.component';
import { PagerComponent } from 'src/app/shared/components/pager/pager.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProductService } from 'src/app/core/services/product.service';
import { ProductAttributeService } from 'src/app/core/services/product-attribute.service';
import { IBrand } from 'src/app/shared/models/brand';
import { IProduct } from 'src/app/shared/models/product';
import { IProductAttribute } from 'src/app/shared/models/productAttribute';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { IProductType } from 'src/app/shared/models/productType';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { MatSelectModule } from '@angular/material/select';
import { ProductItemComponent } from './product-item/product-item.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslatePipe, RouterModule, MatSelectModule, MatCheckboxModule, ProductItemComponent, PagingHeaderComponent, PagerComponent, MatProgressSpinnerModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatIconModule, MatCardModule, FormsModule]
})
export class ShopComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  searchTerm = viewChild.required<ElementRef<HTMLInputElement>>('search');

  private productService = inject(ProductService);
  private attributeService = inject(ProductAttributeService);

  products   = signal<IProduct[]>([]);
  brands     = signal<IBrand[]>([]);
  types      = signal<IProductType[]>([]);
  /** Filterable attributes (Size, Color, Pattern, …) rendered as facet checkbox groups. */
  facetAttributes = signal<IProductAttribute[]>([]);
  /** attributeId → selected value ids; one attrValues entry per attribute goes to the API. */
  private selectedFacets = signal<Record<number, number[]>>({});
  shopParams = signal<ProductQueryParams>({} as ProductQueryParams);
  totalCount = signal<number>(0);
  isLoading  = signal<boolean>(false);

  cols           = signal<number>(3);
  isMobileScreen = signal<boolean>(false);
  filtersHidden  = signal<boolean>(true);

  // name holds a translation key; the template renders it through the translate pipe.
  readonly sortOptions = [
    { name: TranslationKeys.Shop.SortAlphabetical, value: 'name' },
    { name: TranslationKeys.Shop.SortPriceAsc, value: 'priceAsc' },
    { name: TranslationKeys.Shop.SortPriceDesc, value: 'priceDesc' },
  ];

  readonly saleOptions = [
    { name: TranslationKeys.Shop.AllProducts, value: 'all' },
    { name: TranslationKeys.Shop.OnlySaleProducts, value: 'sale' },
    { name: TranslationKeys.Shop.NonSaleProducts, value: 'nonSale' },
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
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.productService.getProducts(isActive));
      if (response) {
        this.products.set(response.data);
        this.totalCount.set(response.count);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // getFilters method
  async getFilters(): Promise<void> {
    try {
      const [brands, types, attributes] = await Promise.all([
        firstValueFrom(this.productService.getBrands(true)),
        firstValueFrom(this.productService.getTypes(true)),
        firstValueFrom(this.attributeService.getAllAttributes(true)),
      ]);

      this.brands.set([{ id: 0, name: 'All Brands' }, ...brands]);
      this.types.set([{ id: 0, name: 'All Types' }, ...types]);
      this.facetAttributes.set(attributes
        .filter(a => a.isFilterable && (a.values?.filter(v => v.isActive).length ?? 0) > 0)
        .map(a => ({ ...a, values: a.values!.filter(v => v.isActive) })));
    } catch (error) {
      console.error(error);
    }
  }

  // --- Attribute facets ---------------------------------------------------

  isFacetSelected(attributeId: number, valueId: number): boolean {
    return this.selectedFacets()[attributeId]?.includes(valueId) ?? false;
  }

  async toggleFacetValue(attributeId: number, valueId: number): Promise<void> {
    const facets = { ...this.selectedFacets() };
    const current = facets[attributeId] ?? [];
    facets[attributeId] = current.includes(valueId)
      ? current.filter(id => id !== valueId)
      : [...current, valueId];
    if (facets[attributeId].length === 0) {
      delete facets[attributeId];
    }
    this.selectedFacets.set(facets);

    const params = this.productService.getShopParams();
    params.attrValues = Object.values(facets).map(ids => ids.join(','));
    params.pageNumber = 1;
    this.productService.setShopParams(params);
    this.shopParams.set(params);
    await this.getProducts();
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    this.selectedFacets.set({});
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