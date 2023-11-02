import { Injectable } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, catchError, debounceTime, map, of, switchMap } from 'rxjs';
import { PaginationWithData } from 'src/app/shared/models/pagination';
import { ISearchParams } from 'src/app/shared/models/queryParams';

@Injectable({
  providedIn: 'root'
})
export class SearchService<T> {
  private searchTerms = new BehaviorSubject('');

  constructor() { }

  applyFilter(filterValueEvent: Event, paginator: MatPaginator, queryParams: ISearchParams): void {
    const filterValue = (filterValueEvent.target as HTMLInputElement).value;
    queryParams.search = filterValue.trim().toLowerCase();

    if (queryParams.search) {
      paginator.firstPage();
    }

    this.searchTerms.next(queryParams.search);
  }

  handleSearch(fetchFunction: () => Observable<PaginationWithData<T> | null>): Observable<PaginationWithData<T>> {
    return this.searchTerms.pipe(
      debounceTime(500),
      switchMap(() => {
        return fetchFunction().pipe(
          map(result => result !== null ? result : { pageIndex: 1, pageSize: 0, count: 0, data: [] })
        );
      }),
      catchError(error => {
        console.error(error);
        return of({ pageIndex: 1, pageSize: 0, count: 0, data: [] });
      })
    );
  }
}
