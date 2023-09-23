import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { DeleteResponse } from 'src/app/shared/models/delete-response.model';
import { ProductTypePagination } from 'src/app/shared/models/pagination';
import { IProductType } from 'src/app/shared/models/productType';
import { ProductTypeParams } from 'src/app/shared/models/productTypeParams';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductTypeService {
  readonly baseUrl: string = environment.apiUrl;
  pagination: ProductTypePagination = new ProductTypePagination();
  typeParams: ProductTypeParams = new ProductTypeParams();

  constructor(private http: HttpClient) { }

  gettypes(typeParameters: ProductTypeParams, isActive: boolean | null = null): Observable<ProductTypePagination> {
    let params = new HttpParams();
    if (isActive !== null) {
      params = params.append("isActive", isActive.toString());
    }
    if (typeParameters) {
      if (typeParameters.pageNumber > 0) {
        params = params.append('pageIndex', typeParameters.pageNumber.toString());
      }
      if (typeParameters.pageSize > 0) {
        params = params.append('pageSize', typeParameters.pageSize.toString());
      }
    }

    return this.http.get<ProductTypePagination>(`${this.baseUrl}producttype/types`, { observe: 'response', params }).pipe(
      tap(response => this.pagination = response.body ?? ({} as ProductTypePagination)),
      map(response => response.body as ProductTypePagination)
    );
  }

  getType(id: number): Observable<IProductType> {
    return this.http.get<IProductType>(`${this.baseUrl}producttype/type/${id}`);
  }

  createType(typePayload: IProductType) {
    return this.http.post<IProductType>(`${this.baseUrl}producttype/create/`, typePayload);
  }

  updateType(typePayload: IProductType) {
    return this.http.put<IProductType>(`${this.baseUrl}producttype/update/${typePayload.id}`, typePayload);;
  }

  deleteType(id: number): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.baseUrl}producttype/delete/${id}`);
  }

  setTypeParams(params: ProductTypeParams): void {
    this.typeParams = params;
  }

  getTypeParams(): ProductTypeParams {
    return this.typeParams;
  }
}
