import { AfterViewInit, Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { merge, Subject, takeUntil } from 'rxjs';
import { DiscountService } from 'src/app/core/services/discount.service';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { SearchService } from 'src/app/core/services/utility-services/search.service';
import { IDiscount } from 'src/app/shared/models/discount-system';
import { DiscountParams } from 'src/app/shared/models/DiscountParams';
import { PaginationWithData } from 'src/app/shared/models/pagination';
import { PolicyNames } from 'src/app/shared/models/policy';
import { SharedModule } from "../../../../shared/shared.module";

import { ProductService } from 'src/app/core/services/product.service';

@Component({
  selector: 'app-discounts',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    SharedModule
],
  templateUrl: './discounts.component.html',
  styleUrl: './discounts.component.scss'
})
export class DiscountsComponent implements OnInit, AfterViewInit, OnDestroy {
  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sort = viewChild.required<MatSort>(MatSort);

  policyNames = PolicyNames;

  discounts        = signal<IDiscount[]>([]);
  discountParams   = signal<DiscountParams>({} as DiscountParams);
  totalCount       = signal<number>(0);
  isLoadingResults = signal<boolean>(true);
  dataSource       = signal<IDiscount[]>([]);
  pageSizeOptions  = signal<number[]>([5, 10, 25]);

  columnsToDisplay: string[] = ['id', 'name', 'startDate', 'endDate', 'isActive', 'Action'];
  columnDisplayNames: { [key: string]: string } = {
    'id': 'ID',
    'name': 'Name',
    'startDate': 'Start Date',
    'endDate': 'End Date',
    'isActive': 'Active?',
    'Action': 'Action'
  };

  destroy$ = new Subject<void>();

  private router          = inject(Router);
  private discountService = inject(DiscountService);
  private productService  = inject(ProductService);
  private deleteService   = inject(DeleteService);
  private searchService   = inject(SearchService<IDiscount>);

  constructor() {
    this.discountParams.set(new DiscountParams());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.searchService.handleSearch(() => {
      const currentParams = this.discountParams();
      return this.discountService.getDiscounts(currentParams)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => this.updateDiscounts(response));
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort().sortChange.pipe(takeUntil(this.destroy$)).subscribe(() => (this.paginator().pageIndex = 0));
    this.getDiscounts();

    merge(this.sort().sortChange, this.paginator().page)
      .pipe(takeUntil(this.destroy$))
      .subscribe((x: Sort | PageEvent) => {

        const sortEvent = x as Sort;
        if ((x as PageEvent).pageSize) {
          const pageEvent = x as PageEvent;
          this.discountParams.update(params => ({
            ...params,
            pageNumber: pageEvent.pageIndex + 1,
            pageSize: pageEvent.pageSize
          }));
        }
        if (sortEvent) {
          this.discountParams.update(params => ({
            ...params,
            sort: this.sort().active,
            sortDirection: this.sort().direction
          }));
        }
        this.getDiscounts();
      });
  }

  private updateDiscounts(response: PaginationWithData<IDiscount>): void {
    this.discounts.update(() => (response.data));
    this.totalCount.update(() => (response.count));
    this.dataSource.update(() => this.discounts());
  }

  getDiscounts(): void {
    this.discountService.discountParams = this.discountParams();
    this.discountService.getDiscounts(this.discountParams())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            this.updateDiscounts(response);

            // Additional check for empty data after successful response
            if (response.data.length === 0) {
              this.handleNoDiscounts();
            }
          } else {
            this.handleNoDiscounts();
          }
        },
        error: (error) => {
          console.error(error);
        }
      });
  }

  private handleNoDiscounts(): void {
    // Clear all discounts
    this.discounts.set([]);
    this.dataSource.set([]);
    this.totalCount.set(0);

    // Reset pagination
    const paginator = this.paginator();
    if (paginator.pageIndex > 0) {
      paginator.pageIndex = 0;

      // Update params to match new pagination state
      this.discountParams.update(params => ({
        ...params,
        pageNumber: 1,
        pageSize: params.pageSize
      }));
    }
  }

  applyFilter(filterValueEvent: Event) {
    this.searchService.applyFilter(filterValueEvent, this.paginator(), this.discountParams());
  }

  editDiscount(row: IDiscount): void {
    if (row.discountGroupId) {
      this.router.navigateByUrl(`/admin/discounts/edit/${row.id}`);
    } else {
      if (row.id)
      {
        this.productService.getProductIdByDiscountId(row.id).subscribe({
          next: (productId) => {
            console.log("Single discount! Navigating to product:", productId);
            this.router.navigateByUrl(`/admin/products/edit/${productId}`);
          },
          error: (err) => {
            console.error("Error while fetching productId for discount", row.id, err);
          }
        });
      }
    }
  }

  deleteDiscount(id: number) {
    this.deleteService.deleteObject(
      id,
      () => this.discountService.deleteDiscount(id),
      () => this.getDiscounts());
  }

  createDiscount() {
    this.router.navigateByUrl(`/admin/discounts/edit/${-1}`);
  }
}
