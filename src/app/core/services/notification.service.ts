import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeleteResponse } from 'src/app/shared/models/delete-response.model';
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

  removeSubscription(subscription: INotificationSubscription): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.baseUrl}notificationSubscription/delete`, { body: subscription });
  }

  checkSubscription(productId: number, userId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}NotificationSubscription/check?productId=${productId}&userId=${userId}`);
  }
}
