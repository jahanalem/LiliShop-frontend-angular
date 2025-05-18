import { IDiscount } from './../../shared/models/discount-system';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { DiscountParams } from 'src/app/shared/models/DiscountParams';
import { DiscountPagination, PaginationWithData } from 'src/app/shared/models/pagination';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  baseUrl = environment.apiUrl;

  pagination: DiscountPagination = new PaginationWithData<IDiscount>();
  discountParams: DiscountParams = new DiscountParams();

  private http = inject(HttpClient);

  constructor() { }

  setBrandParams(params: DiscountParams): void {
    this.discountParams = params;
  }

  getBrandParams(): DiscountParams {
    return this.discountParams;
  }

  getDiscounts(discountParameters: DiscountParams, isActive: boolean | null = null):
    Observable<DiscountPagination> {

    let params = new HttpParams();
    if (isActive !== null) {
      params = params.append("isActive", isActive.toString());
    }
    if (discountParameters) {
      if (discountParameters.pageNumber > 0) {
        params = params.append('pageIndex', discountParameters.pageNumber.toString());
      }
      if (discountParameters.pageSize > 0) {
        params = params.append('pageSize', discountParameters.pageSize.toString());
      }
      if(discountParameters.search){
        params = params.append('search', discountParameters.search.trim())
      }
      if(discountParameters.sort){
        params = params.append('sort', discountParameters.sort);
      }
      if(discountParameters.sortDirection){
        params = params.append('sortDirection', discountParameters.sortDirection);
      }
    }

    return this.http.get<DiscountPagination>(`${this.baseUrl}discounts/discounts`,
      { observe: 'response', params })
      .pipe(
        tap(response => this.pagination = response.body ?? ({} as DiscountPagination)),
        map(response => response.body as DiscountPagination)
      );
  }

  getDiscount(id: number): Observable<IDiscount> {
    return this.http.get<IDiscount>(`${this.baseUrl}discounts/${id}`);
  }

  createDiscount(discount: IDiscount): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}discounts/create/`, discount);
  }

  updateDiscount(discount: IDiscount): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}discounts/update/${discount.id}`, discount);
  }

  deleteDiscount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}discounts/delete/${id}`)
      .pipe(catchError(error => {
        console.error(error);
        return throwError(() => error);
      }));
  }
}
