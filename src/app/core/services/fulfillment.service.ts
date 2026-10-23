import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CustomerProcessing, FulfillmentDetail, FulfillmentPage, WorkerControl } from 'src/app/shared/models/fulfillment';

@Injectable({ providedIn: 'root' })
export class FulfillmentService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}fulfillment`;
  status(orderId: number) { return this.http.get<CustomerProcessing>(`${this.url}/orders/${orderId}`); }
  list(page = 1, state = '') {
    return this.http.get<FulfillmentPage>(this.url, { params: new HttpParams().set('page', page).set('pageSize', 25).set('state', state) });
  }
  detail(id: string) { return this.http.get<FulfillmentDetail>(`${this.url}/${encodeURIComponent(id)}`); }
  retry(id: string, revision: number, reason: string, email = false) {
    return this.http.post<{accepted: boolean}>(`${this.url}/${encodeURIComponent(id)}/retry`, { revision, reason, email });
  }
  control() { return this.http.get<WorkerControl>(`${this.url}/control`); }
  updateControl(revision: number, enabled: boolean, reason: string) { return this.http.put<WorkerControl>(`${this.url}/control`, {revision, enabled, reason}); }
}
