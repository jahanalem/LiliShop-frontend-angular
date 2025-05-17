import { SubscriptionService } from '../../../../core/services/subscription.service';
import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, OnDestroy, inject, viewChild, signal } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { Subject, takeUntil } from 'rxjs';

import { IPriceDropSubscription } from 'src/app/shared/models/priceDropSubscription';

import { PriceDropSubscriptionQueryParams } from 'src/app/shared/models/priceDropSubscriptionQueryParams';
import { PriceDropSubscriptionPagination } from 'src/app/shared/models/pagination';

@Component({
  selector: 'app-price-drop-subscription',
  templateUrl: './price-drop-subscription.component.html',
  styleUrls: ['./price-drop-subscription.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceDropSubscriptionComponent implements OnInit, AfterViewInit, OnDestroy {
  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sort = viewChild.required<MatSort>(MatSort);

  private subscriptionService = inject(SubscriptionService);

  pageSizeOptions = signal<number[]>([5, 10, 25]);
  queryParams = signal<PriceDropSubscriptionQueryParams>(new PriceDropSubscriptionQueryParams());
  subscriptions = signal<IPriceDropSubscription[]>([]);
  totalCount = signal<number>(0);
  isLoading = signal<boolean>(false);

  columnsToDisplay: string[] = [
    'userId',
    'displayName',
    'email',
    'productId',
    'productName',
    'productPrice',
    'subscriptionDate',
    'oldPrice'
  ];

  private destroy$ = new Subject<void>();
  constructor() { }

  ngOnInit(): void {
    this.getSubscriptions();
  }

  ngAfterViewInit(): void {
    this.paginator().page.pipe(takeUntil(this.destroy$))
      .subscribe((pageEvent: PageEvent) => {
        this.queryParams.update(qp => {
          const newParams = new PriceDropSubscriptionQueryParams();
          newParams.pageNumber = pageEvent.pageIndex + 1;
          newParams.pageSize = pageEvent.pageSize;
          newParams.sort = qp.sort;
          newParams.sortDirection = qp.sortDirection;
          newParams.search = qp.search;
          return newParams;
        });
        this.getSubscriptions();
      });

    this.sort().sortChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((sortEvent: Sort) => {
        this.queryParams.update(qp => {
          const newParams = new PriceDropSubscriptionQueryParams();
          newParams.pageNumber = qp.pageNumber;
          newParams.pageSize = qp.pageSize;
          newParams.sort = sortEvent.active;
          newParams.sortDirection = sortEvent.direction;
          newParams.search = qp.search;
          return newParams;
        });
        this.getSubscriptions();
      });
  }

  getSubscriptions(): void {
    this.isLoading.set(true);
    this.subscriptionService.getPriceDropSubscriptions(this.queryParams())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PriceDropSubscriptionPagination) => {
          this.subscriptions.set(response.data);
          this.totalCount.set(response.count);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching price drop subscriptions', error);
          this.isLoading.set(false);
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.queryParams.update(qp => {
      const newParams = new PriceDropSubscriptionQueryParams();
      newParams.pageNumber = 1;
      newParams.pageSize = qp.pageSize;
      newParams.sort = qp.sort;
      newParams.sortDirection = qp.sortDirection;
      newParams.search = filterValue;
      return newParams;
    });
    this.getSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
