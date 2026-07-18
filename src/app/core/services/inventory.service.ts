import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IPaginationWithData } from 'src/app/shared/models/pagination';
import { IVariantInventory } from 'src/app/shared/models/productVariant';
import { environment } from 'src/environments/environment';

export type InventoryTransactionType =
  'Receive' | 'Adjust' | 'Reserve' | 'ReleaseReservation' | 'Deduct' | 'Refund';

export interface IInventoryTransaction {
  id: number;
  productVariantId: number;
  delta: number;
  type: InventoryTransactionType;
  reason?: string | null;
  orderId?: number | null;
  performedBy?: string | null;
  createdDate?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);

  readonly baseUrl: string = environment.apiUrl;

  /** Manual stock correction; the backend refuses deltas that would push available stock below zero. */
  adjust(variantId: number, delta: number, reason: string): Observable<IVariantInventory> {
    return this.http.post<IVariantInventory>(
      `${this.baseUrl}inventory/variants/${variantId}/adjustments`, { delta, reason });
  }

  getTransactions(variantId: number, pageIndex = 1, pageSize = 10): Observable<IPaginationWithData<IInventoryTransaction>> {
    const params = new HttpParams()
      .set('pageIndex', pageIndex)
      .set('pageSize', pageSize);
    return this.http.get<IPaginationWithData<IInventoryTransaction>>(
      `${this.baseUrl}inventory/variants/${variantId}/transactions`, { params });
  }
}
