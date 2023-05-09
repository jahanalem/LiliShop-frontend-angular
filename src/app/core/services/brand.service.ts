import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IBrand } from 'src/app/shared/models/brand';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }


  getBrands(isActive: boolean | null = null): Observable<IBrand[]> {
    const params = isActive !== null ? new HttpParams().append("isActive", isActive.toString()) : new HttpParams();
    return this.http.get<IBrand[]>(this.baseUrl + 'productbrand/brands', { params });
  }
}
