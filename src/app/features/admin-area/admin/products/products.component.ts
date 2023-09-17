import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { IProduct } from 'src/app/shared/models/product';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { merge } from 'rxjs';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/core/services/product.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { DialogData } from 'src/app/shared/models/dialog-data.interface';

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

  constructor(private productService: ProductService, private router: Router, public dialog: MatDialog) {
    this.shopParams = this.productService.getShopParams();
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
    this.productService.getProducts(useCache, isActive).subscribe(response => {
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

  applyFilter(filterValueEvent: Event) {
    const filterValue = (filterValueEvent.target as HTMLInputElement).value;
    this.shopParams.search = filterValue.trim().toLowerCase();

    if (this.shopParams.search) {
      this.paginator.firstPage();
    }
    this.getProducts(false);
  }

  editProduct(id: number) {
    this.router.navigateByUrl(`/admin/products/edit/${id}`);
  }

  showProduct(id: number) {
    window.open(`/shop/${id}`, "_blank");
  }

  deleteProduct(id: number) {

    const dialogData: DialogData = {
      title: 'Delete Dialog',
      content: 'Would you like to delete this item?',
      showConfirmationButtons: true
    };

    const dialogRef = this.dialog.open<DialogComponent, DialogData>(DialogComponent, { data: dialogData });

    dialogRef.afterClosed().subscribe({
      next: (result?: boolean | undefined) => {
        if (!result) {
          return;
        }
        console.log(result);
        this.productService.deleteProduct(id).subscribe({
          next: () => {
            console.log("product deleted!");
            this.getProducts(false);
          },
          error: (error) => { console.error(error) }
        })
      },
      error: (error) => { console.error(error) }
    })
  }

  createProduct() {
    this.router.navigateByUrl(`/admin/products/edit/${-1}`);
  }
}
