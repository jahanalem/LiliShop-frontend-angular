
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { IOrder, IOrderToCreate } from 'src/app/shared/models/order';


@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getDeliveryMethods(): Observable<IDeliveryMethod[]> {
    return this.http.get<IDeliveryMethod[]>(`${this.baseUrl}orders/deliveryMethods`).pipe(
      map((dm: IDeliveryMethod[]) => dm.sort((a, b) => b.price - a.price))
    );
  }


  createOrder(order: IOrderToCreate): Observable<IOrder> {
    return this.http.post<IOrder>(`${this.baseUrl}orders`, order);
  }
}
