
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
  private readonly baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Fetches available delivery methods from the server.
   *
   * Sends a GET request to fetch all available delivery methods and sorts them by price in descending order.
   *
   * @returns {Observable<IDeliveryMethod[]>} An Observable of an array of delivery methods.
   */
  getDeliveryMethods(): Observable<IDeliveryMethod[]> {
    const url = `${this.baseUrl}orders/deliveryMethods`;
    return this.http.get<IDeliveryMethod[]>(url).pipe(
      map((dm: IDeliveryMethod[]) => dm.sort((a, b) => b.price - a.price))
    );
  }

  /**
   * Creates a new order on the server.
   *
   * Sends a POST request to the server with the order details to create a new order.
   *
   * @param {IOrderToCreate} order - The details of the order to create.
   * @returns {Observable<IOrder>} An Observable of the created order.
   */
  createOrder(order: IOrderToCreate): Observable<IOrder> {
    const url = `${this.baseUrl}orders`;
    return this.http.post<IOrder>(url, order);
  }
}
