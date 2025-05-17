import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { INotificationSubscription } from 'src/app/shared/models/notificationSubscription';
import { PriceDropSubscriptionPagination } from 'src/app/shared/models/pagination';
import { IPriceDropSubscription } from 'src/app/shared/models/priceDropSubscription';
import { PriceDropSubscriptionQueryParams } from 'src/app/shared/models/priceDropSubscriptionQueryParams';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }


  addSubscription(subscription: INotificationSubscription): Observable<INotificationSubscription> {
    return this.http.post<INotificationSubscription>(`${this.baseUrl}notificationSubscription/add`, subscription);
  }

  removeSubscription(subscription: INotificationSubscription): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}notificationSubscription/delete`, { body: subscription });
  }

  unsubscribe(userId: number, productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}notificationSubscription/unsubscribe/${userId}/${productId}`);
  }

  checkSubscription(productId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}NotificationSubscription/check?productId=${productId}&userId=${userId}`);
  }

  getPriceDropSubscriptions(queryParams: PriceDropSubscriptionQueryParams): Observable<PriceDropSubscriptionPagination> {
    return this.http.get<PriceDropSubscriptionPagination>(`${this.baseUrl}notificationSubscription/subscriptions/price-drop`, { params: queryParams.toHttpParams() })
  }

  getUserSubscriptions(userId: number): Observable<IPriceDropSubscription[]> {
    return this.http.get<IPriceDropSubscription[]>(`${this.baseUrl}notificationSubscription/subscriptions/price-drop/${userId}`)
  }
}
