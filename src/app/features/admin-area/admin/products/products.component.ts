import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, signal, ChangeDetectorRef, viewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { IProduct } from 'src/app/shared/models/product';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { Observable, merge } from 'rxjs';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/core/services/product.service';
import { PaginationWithData } from 'src/app/shared/models/pagination';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { SearchService } from 'src/app/core/services/utility-services/search.service';
import { AccountService } from 'src/app/core/services/account.service';
import { Action, AuthorizationService } from 'src/app/core/services/authorization.service';
import { PolicyNames } from 'src/app/shared/models/policy';

export declare interface IPageEvent {
  /** The current page index. */
  pageIndex: number;
  /**
   * Index of the page that was selected previously.
   */
  previousPageIndex?: number;
  /** The current page size. */
  pageSize: number;
  /** The current total number of items being paged. */
  length: number;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent implements OnInit, AfterViewInit {
  paginator        = viewChild.required<MatPaginator>(MatPaginator);
  sort             = viewChild.required<MatSort>(MatSort);
  policyNames      = PolicyNames;
  products         = signal<IProduct[]>([]);
  shopParams       = signal<ProductQueryParams>(this.productService.getShopParams());
  totalCount       = signal<number>(0);
  isLoadingResults = signal<boolean>(true);
  userRole         = signal<string>('');
  dataSource       = signal<IProduct[]>([]);
  columnsToDisplay: string[] = ['id', 'name', 'price', 'productType', 'productBrand', 'Action'];

  constructor(private productService: ProductService,
    private router: Router,
    private deleteService: DeleteService,
    private searchService: SearchService<IProduct>,
    private accountService: AccountService,
    private authorizationService: AuthorizationService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.searchService.handleSearch(() => this.productService.getProducts())
      .subscribe(response => this.updateProducts(response));
    this.accountService.currentUser$.subscribe(user => {
      this.userRole.set(user?.role ?? '');
    })
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort().sortChange.subscribe(() => (this.paginator().pageIndex = 0));
    this.getProducts();

    merge(this.sort().sortChange, this.paginator().page)
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

        console.log("shop params =", this.shopParams());
        this.getProducts();
      });
  }

  private updateProducts(response: PaginationWithData<IProduct>): void {
    this.products.update(() => (response.data));
    this.totalCount.update(() => (response.count));
    this.dataSource.update(() => this.products());
    this.cdr.markForCheck();
  }

  getProducts(isActive?: boolean): void {
    this.productService.shopParams = this.shopParams();
    this.productService.getProducts(isActive)
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

  canCreate(): Observable<boolean> {
    return this.authorizationService.isActionAllowed(Action.Create, this.userRole());
  }
  canUpdate(): Observable<boolean> {
    return this.authorizationService.isActionAllowed(Action.Update, this.userRole());
  }
  canDelete(): Observable<boolean> {
    return this.authorizationService.isActionAllowed(Action.Delete, this.userRole());
  }
}
