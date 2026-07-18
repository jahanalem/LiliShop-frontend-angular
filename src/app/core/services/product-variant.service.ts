import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IProductVariant, IVariantUpsertRow } from 'src/app/shared/models/productVariant';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductVariantService {
  private http = inject(HttpClient);

  readonly baseUrl: string = environment.apiUrl;

  getVariants(productId: number): Observable<IProductVariant[]> {
    return this.http.get<IProductVariant[]>(`${this.baseUrl}productvariants/product/${productId}`);
  }

  /** Batch add/update; rows missing from the payload are kept (delete is explicit). */
  saveVariants(productId: number, rows: IVariantUpsertRow[]): Observable<IProductVariant[]> {
    return this.http.put<IProductVariant[]>(`${this.baseUrl}productvariants/product/${productId}`, rows);
  }

  deleteVariant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}productvariants/${id}`);
  }
}
