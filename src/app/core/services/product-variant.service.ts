import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IProductVariant, IVariantGenerationRequest, IVariantUpsertRow } from 'src/app/shared/models/productVariant';
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

  /**
   * Generate-then-review: the server expands the cartesian product of the requested defining axes
   * into DRAFT rows (existing combinations skipped, SKUs rendered from the pattern) without saving.
   * The returned rows are edited and persisted via {@link saveVariants}.
   */
  generateVariants(productId: number, request: IVariantGenerationRequest): Observable<IVariantUpsertRow[]> {
    return this.http.post<IVariantUpsertRow[]>(`${this.baseUrl}productvariants/product/${productId}/generate`, request);
  }

  deleteVariant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}productvariants/${id}`);
  }
}
