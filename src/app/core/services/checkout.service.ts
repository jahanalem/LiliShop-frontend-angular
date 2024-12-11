
import { catchError, map, Observable, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { IOrder, IOrderToCreate } from 'src/app/shared/models/order';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly baseUrl: string = environment.apiUrl;
  private router = inject(Router);

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
      map((dm: IDeliveryMethod[]) => dm.sort((a, b) => b.price - a.price)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('User is not authenticated. Please log in.');
          this.router.navigate(['/account/login']);
        } else if (error.status === 404) {
          console.warn('No delivery methods found.');
        } else {
          console.error('An error occurred while fetching delivery methods:', error);
        }
        
        return of([]);
      })
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
