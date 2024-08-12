import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { INotificationSubscription } from 'src/app/shared/models/notificationSubscription';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }


  addSubscription(subscription: INotificationSubscription): Observable<INotificationSubscription> {
    return this.http.post<INotificationSubscription>(`${this.baseUrl}notificationSubscription/add`, subscription);
  }

  removeSubscription(subscription: INotificationSubscription): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}notificationSubscription/delete`, { body: subscription });
  }

  checkSubscription(productId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}NotificationSubscription/check?productId=${productId}&userId=${userId}`);
  }
}
