
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IOrder } from 'src/app/shared/models/order';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private http = inject(HttpClient);

  baseUrl = environment.apiUrl;

  getOrdersForUser(): Observable<IOrder[]> {
    return this.http.get<IOrder[]>(this.baseUrl + 'orders');
  }

  getOrderDetailed(id: number): Observable<IOrder> {
    return this.http.get<IOrder>(this.baseUrl + 'orders/' + id);
  }
}
