import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IInvoice, IInvoiceSummary } from 'src/app/shared/models/invoice';
import { IPaginationWithData } from 'src/app/shared/models/pagination';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /** Customer: the invoice for one of their own orders. Returns null (HTTP 204) when the order has no
   *  invoice yet or is not theirs — never a 404, so it never trips the global not-found redirect. */
  getInvoiceForOrder(orderId: number): Observable<IInvoice | null> {
    return this.http.get<IInvoice | null>(`${this.baseUrl}orders/${orderId}/invoice`);
  }

  /** Admin: paged, read-only invoice list. */
  getInvoices(pageIndex: number, pageSize: number, search?: string): Observable<IPaginationWithData<IInvoiceSummary>> {
    let params = new HttpParams()
      .set('pageIndex', pageIndex)
      .set('pageSize', pageSize);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<IPaginationWithData<IInvoiceSummary>>(`${this.baseUrl}invoices`, { params });
  }

  /** Admin: full invoice detail. */
  getInvoiceById(id: number): Observable<IInvoice> {
    return this.http.get<IInvoice>(`${this.baseUrl}invoices/${id}`);
  }

  /** Customer: download the invoice PDF for one of their own orders. */
  getInvoicePdfForOrder(orderId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}orders/${orderId}/invoice/pdf`, { responseType: 'blob' });
  }

  /** Admin: download the invoice PDF. */
  getAdminInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}invoices/${id}/pdf`, { responseType: 'blob' });
  }

  /** Triggers a browser download of a fetched blob. */
  savePdf(blob: Blob, invoiceNumber: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invoiceNumber}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
