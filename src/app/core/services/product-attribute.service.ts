import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  IProductAttribute,
  ProductAttributeParams,
  ProductAttributePagination
} from 'src/app/shared/models/productAttribute';
import { PaginationWithData } from 'src/app/shared/models/pagination';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductAttributeService {
  private http = inject(HttpClient);

  readonly baseUrl: string = environment.apiUrl;
  pagination: ProductAttributePagination = new PaginationWithData<IProductAttribute>();
  attributeParams: ProductAttributeParams = new ProductAttributeParams();

  getAttributes(attributeParameters: ProductAttributeParams, isActive: boolean | null = null): Observable<ProductAttributePagination> {
    let params = new HttpParams();
    if (isActive !== null) {
      params = params.append('isActive', isActive.toString());
    }
    if (attributeParameters) {
      if (attributeParameters.pageNumber > 0) {
        params = params.append('pageIndex', attributeParameters.pageNumber.toString());
      }
      if (attributeParameters.pageSize > 0) {
        params = params.append('pageSize', attributeParameters.pageSize.toString());
      }
    }

    return this.http.get<ProductAttributePagination>(`${this.baseUrl}productattributes/attributes`, { observe: 'response', params }).pipe(
      tap(response => this.pagination = response.body ?? ({} as ProductAttributePagination)),
      map(response => response.body as ProductAttributePagination)
    );
  }

  /** All attributes incl. values, localized — for dropdowns and (later) storefront facets. */
  getAllAttributes(isActive: boolean | null = null): Observable<IProductAttribute[]> {
    let params = new HttpParams();
    if (isActive !== null) {
      params = params.append('isActive', isActive.toString());
    }
    return this.http.get<IProductAttribute[]>(`${this.baseUrl}productattributes/all`, { params });
  }

  getAttribute(id: number): Observable<IProductAttribute> {
    return this.http.get<IProductAttribute>(`${this.baseUrl}productattributes/attribute/${id}`);
  }

  createAttribute(attributePayload: IProductAttribute): Observable<IProductAttribute> {
    return this.http.post<IProductAttribute>(`${this.baseUrl}productattributes/create/`, attributePayload);
  }

  updateAttribute(attributePayload: IProductAttribute): Observable<IProductAttribute> {
    return this.http.put<IProductAttribute>(`${this.baseUrl}productattributes/update/${attributePayload.id}`, attributePayload);
  }

  deleteAttribute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}productattributes/delete/${id}`);
  }

  deleteValue(attributeId: number, valueId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}productattributes/${attributeId}/values/${valueId}`);
  }

  setAttributeParams(params: ProductAttributeParams): void {
    this.attributeParams = params;
  }

  getAttributeParams(): ProductAttributeParams {
    return this.attributeParams;
  }
}
