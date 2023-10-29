import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { IProduct } from 'src/app/shared/models/product';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { Subject, catchError, debounceTime, merge, of, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/core/services/product.service';
import { PaginationWithData } from 'src/app/shared/models/pagination';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';

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
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  columnsToDisplay: string[] = ['id', 'name', 'price', 'productType', 'productBrand', 'Action'];
  public dataSource!: IProduct[];
  products: IProduct[] = [];
  shopParams: ProductQueryParams;
  totalCount: number = 0;
  isLoadingResults = true;
  private searchTerms = new Subject<string>();
  constructor(private productService: ProductService,
    private router: Router,
    private deleteService: DeleteService) {
    this.shopParams = this.productService.getShopParams();
  }

  ngOnInit(): void {
    this.handleSearch();
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    this.getProducts();

    merge(this.sort.sortChange, this.paginator.page)
      .subscribe((x: Sort | PageEvent) => {

        const sortEvent = x as Sort;
        if ((x as PageEvent).pageSize) {
          const pageEvent = x as PageEvent;
          this.shopParams.pageNumber = pageEvent.pageIndex + 1;
          this.shopParams.pageSize = pageEvent.pageSize;
        }
        if (sortEvent) {
          this.shopParams.sort = this.sort.active;
          this.shopParams.sortDirection = this.sort.direction;
        }
        this.getProducts();
      });
  }

  private updateProducts(response: PaginationWithData<IProduct>): void {
    this.products = response.data;
    this.totalCount = response.count;
    this.dataSource = this.products;
  }

  getProducts(isActive?: boolean): void {
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

  handleSearch() {
    this.searchTerms.pipe(
      debounceTime(500),

      switchMap((term: string) => {
        this.shopParams.search = term;
        return this.productService.getProducts();
      }),

      catchError(error => {
        console.error(error);
        return of([]);
      })
    ).subscribe({
      next: (response) => {
        if (response && 'data' in response && 'count' in response) {
          this.updateProducts(response);
        }
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  applyFilter(filterValueEvent: Event) {
    const filterValue = (filterValueEvent.target as HTMLInputElement).value;
    this.shopParams.search = filterValue.trim().toLowerCase();

    if (this.shopParams.search) {
      this.paginator.firstPage();
    }

    // Emit the new search term
    this.searchTerms.next(this.shopParams.search);
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
