import { IDiscount } from './../../shared/models/discount-system';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
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
    }

    return this.http.get<DiscountPagination>(`${this.baseUrl}discount/discounts`, { observe: 'response', params })
      .pipe(
        tap(response => this.pagination = response.body ?? ({} as DiscountPagination)),
        map(response => response.body as DiscountPagination)
      );
  }

  getDiscount(id: number): Observable<IDiscount> {
    return this.http.get<IDiscount>(`${this.baseUrl}discount/${id}`);
  }

  createDiscount(discount: IDiscount): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}discount/create/`, discount);
  }

  updateDiscount(discount: IDiscount): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}discount/update/${discount.id}`, discount);
  }
}

