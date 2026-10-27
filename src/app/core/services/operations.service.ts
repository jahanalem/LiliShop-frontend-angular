import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { HANDLE_ERROR_LOCALLY } from '../interceptors/local-error-handling';
import { environment } from 'src/environments/environment';
import { CheckoutDetail, ControlsStatus, InboxDetail, MailRow, OperationsKind, OperationsPage, OperationsQuery, OperationsRow, OperationsSummary, OrderDetail, WorkDetail } from 'src/app/shared/models/operations';

@Injectable({providedIn: 'root'})
export class OperationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}operations`;
  private options = {context:new HttpContext().set(HANDLE_ERROR_LOCALLY,true)};
  summary() { return this.http.get<OperationsSummary>(`${this.base}/summary`, this.options); }
  list(kind: OperationsKind, query: OperationsQuery) {
    let params = new HttpParams();
    for (const [key,value] of Object.entries(query)) if (value !== '' && value !== null) params = params.set(key, value);
    return this.http.get<OperationsPage<OperationsRow>>(`${this.base}/${kind}`, {...this.options,params});
  }
  checkout(id: string) { return this.http.get<CheckoutDetail>(`${this.base}/checkouts/${encodeURIComponent(id)}`, this.options); }
  receipt(id: string) { return this.http.get<InboxDetail>(`${this.base}/inbox/${encodeURIComponent(id)}`, this.options); }
  work(id: string) { return this.http.get<WorkDetail>(`${this.base}/processing/${encodeURIComponent(id)}`, this.options); }
  mail(id: string) { return this.http.get<MailRow>(`${this.base}/mail/${encodeURIComponent(id)}`, this.options); }
  order(id: string) { return this.http.get<OrderDetail>(`${this.base}/orders/${encodeURIComponent(id)}`, this.options); }
  controls() { return this.http.get<ControlsStatus>(`${this.base}/controls`, this.options); }
}
