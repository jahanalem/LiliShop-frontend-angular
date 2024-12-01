import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, signal, viewChild, OnDestroy, inject } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { IProduct } from 'src/app/shared/models/product';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { Subject, merge, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/core/services/product.service';
import { PaginationWithData } from 'src/app/shared/models/pagination';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { SearchService } from 'src/app/core/services/utility-services/search.service';
import { PolicyNames } from 'src/app/shared/models/policy';

@Component({
    selector: 'app-products',
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sort      = viewChild.required<MatSort>(MatSort);

  policyNames = PolicyNames;

  products         = signal<IProduct[]>([]);
  shopParams       = signal<ProductQueryParams>({} as ProductQueryParams);
  totalCount       = signal<number>(0);
  isLoadingResults = signal<boolean>(true);
  dataSource       = signal<IProduct[]>([]);
  pageSizeOptions  = signal<number[]>([5, 10, 25]);

  columnsToDisplay: string[] = ['id', 'name', 'price', 'productType', 'productBrand', 'Action'];

  destroy$ = new Subject<void>();

  private productService = inject(ProductService);
  private router         = inject(Router);
  private deleteService  = inject(DeleteService);
  private searchService  = inject(SearchService<IProduct>);

  constructor() {
    this.shopParams.set(new ProductQueryParams());
   }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.searchService.handleSearch(() => this.productService.getProducts())
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => this.updateProducts(response));
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort().sortChange.pipe(takeUntil(this.destroy$)).subscribe(() => (this.paginator().pageIndex = 0));
    this.getProducts();

    merge(this.sort().sortChange, this.paginator().page)
      .pipe(takeUntil(this.destroy$))
      .subscribe((x: Sort | PageEvent) => {

        const sortEvent = x as Sort;
        if ((x as PageEvent).pageSize) {
          const pageEvent = x as PageEvent;
          this.shopParams.update(params => ({
            ...params,
            pageNumber: pageEvent.pageIndex + 1,
            pageSize: pageEvent.pageSize
          }));
        }
        if (sortEvent) {
          this.shopParams.update(params => ({
            ...params,
            sort: this.sort().active,
            sortDirection: this.sort().direction
          }));
        }
        this.getProducts();
      });
  }

  private updateProducts(response: PaginationWithData<IProduct>): void {
    this.products.update(() => (response.data));
    this.totalCount.update(() => (response.count));
    this.dataSource.update(() => this.products());
  }

  getProducts(isActive?: boolean): void {
    this.productService.shopParams = this.shopParams();
    this.productService.getProducts(isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            this.updateProducts(response);
          }
        },
        error: (error) => {
          console.error(error);
        }
      });
  }

  applyFilter(filterValueEvent: Event) {
    this.searchService.applyFilter(filterValueEvent, this.paginator(), this.shopParams());
  }

  editProduct(id: number) {
    this.router.navigateByUrl(`/admin/products/edit/${id}`);
  }

  showProduct(id: number) {
    window.open(`/shop/${id}`, "_blank");
  }

  deleteProduct(id: number) {
    this.deleteService.deleteObject(
      id,
      () => this.productService.deleteProduct(id),
      () => this.getProducts());
  }

  createProduct() {
    this.router.navigateByUrl(`/admin/products/edit/${-1}`);
  }
}
