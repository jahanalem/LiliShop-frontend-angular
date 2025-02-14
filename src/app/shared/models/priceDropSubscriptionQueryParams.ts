import { HttpParams } from '@angular/common/http';
import { ISortParams, IPaginationParams, ISearchParams } from './queryParams';

export class PriceDropSubscriptionQueryParams implements ISortParams, IPaginationParams, ISearchParams {
  sort: string = 'id';
  sortDirection: string = 'desc'; // alternative: 'asc'

  pageNumber: number = 1;
  pageSize: number = 10;

  search: string | null = null;

  toHttpParams(): HttpParams {
    let params = new HttpParams();
    params = params.set('PageIndex', this.pageNumber.toString())
      .set('PageSize', this.pageSize.toString())
      .set('Sort', this.sort)
      .set('SortDirection', this.sortDirection);
    if (this.search) {
      params = params.set('Search', this.search);
    }

    return params;
  }
}
