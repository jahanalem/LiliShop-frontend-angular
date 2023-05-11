import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { BrandParams } from 'src/app/shared/models/BrandParams';
import { BrandPagination } from 'src/app/shared/models/pagination';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  readonly baseUrl: string = environment.apiUrl;
  pagination: BrandPagination = new BrandPagination();
  brandParams: BrandParams = new BrandParams();

  constructor(private http: HttpClient) { }

  getBrands(brandParameters: BrandParams, isActive: boolean | null = null): Observable<BrandPagination> {
    let params = new HttpParams();
    if (isActive !== null) {
      params = params.append("isActive", isActive.toString());
    }
    if (brandParameters) {
      if (brandParameters.pageNumber > 0) {
        params = params.append('pageIndex', brandParameters.pageNumber.toString());
      }
      if (brandParameters.pageSize > 0) {
        params = params.append('pageSize', brandParameters.pageSize.toString());
      }
    }

    return this.http.get<BrandPagination>(`${this.baseUrl}productbrand/brands`, { observe: 'response', params }).pipe(
      tap(response => this.pagination = response.body ?? ({} as BrandPagination)),
      map(response => response.body as BrandPagination)
    );
  }

  setBrandParams(params: BrandParams): void {
    this.brandParams = params;
  }

  getBrandParams(): BrandParams {
    return this.brandParams;
  }
}
