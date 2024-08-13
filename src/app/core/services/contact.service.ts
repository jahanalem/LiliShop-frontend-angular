import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseEntityKeys } from 'src/app/shared/models/baseEntity';
import { IContactUsMessage } from 'src/app/shared/models/contactUsMessage';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  readonly baseUrl: string = environment.apiUrl + 'contactusmessage';
  constructor(private http: HttpClient) { }

  getAllMessages(): Observable<IContactUsMessage[]> {
    return this.http.get<IContactUsMessage[]>(`${this.baseUrl}/messages`);
  }

  getMessageById(id: number): Observable<IContactUsMessage> {
    return this.http.get<IContactUsMessage>(`${this.baseUrl}/message/${id}`);
  }

  createMessage(message: Omit<IContactUsMessage, BaseEntityKeys>): Observable<IContactUsMessage> {
    return this.http.post<IContactUsMessage>(`${this.baseUrl}/create`, message);
  }

  updateMessage(id: number, message: Omit<IContactUsMessage, BaseEntityKeys>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/update/${id}`, message);
  }

  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
