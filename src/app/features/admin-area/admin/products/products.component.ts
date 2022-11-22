import { ShopService } from 'src/app/core/services/shop.service';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { IProduct } from 'src/app/shared/models/product';
import { ShopParams } from 'src/app/shared/models/shopParams';
import { merge } from 'rxjs';
import { Router } from '@angular/router';

export declare interface IPageEvent {
  /** The current page index. */
  pageIndex: number;
  /**
   * Index of the page that was selected previously.
   * @breaking-change 8.0.0 To be made into a required property.
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

  displayedColumns: string[] = ['id', 'name', 'price', 'productType', 'productBrand', 'Action'];
  public dataSource!: IProduct[];
  products: IProduct[] = [];
  shopParams: ShopParams;
  totalCount: number = 0;
  isLoadingResults = true;

  constructor(private _shopService: ShopService, private router: Router) {
    this.shopParams = this._shopService.getShopParams();
  }
  ngOnInit(): void {

  }
  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    this.getProducts(false);

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

        this.getProducts(false);
      });
  }

  getProducts(useCache = false, isActive?: boolean): void {
    this._shopService.getProducts(useCache, isActive).subscribe(response => {
      if (response) {
        this.products = response.data;
        this.totalCount = response.count;
        this.dataSource = (this.products);
        this.paginator = this.paginator;
        this.sort = this.sort;
      }
    }, error => {
      console.log(error);
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.shopParams.search = filterValue.trim().toLowerCase();

    if (this.shopParams.search) {
      this.paginator.firstPage();
    }
    this.getProducts(false);
  }

  editProduct(id:number) {
    this.router.navigateByUrl("/admin/products/edit/" + id );
  }
}
