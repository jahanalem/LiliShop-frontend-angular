import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseEntityKeys } from 'src/app/shared/models/baseEntity';
import { IContactUsMessage } from 'src/app/shared/models/contactUsMessage';
import { ContactUsMessageQueryParams } from 'src/app/shared/models/contactUsMessageQueryParams';
import { ContactUsMessagePagination, PaginationWithData } from 'src/app/shared/models/pagination';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly baseUrl: string = environment.apiUrl + 'contactusmessage';

  messageParams: ContactUsMessageQueryParams = new ContactUsMessageQueryParams();
  pagination = new PaginationWithData<IContactUsMessage>();

  constructor(private http: HttpClient) { }

  setMessageParams(params: ContactUsMessageQueryParams): void {
    this.messageParams = params;
  }
  getMessageParams(): ContactUsMessageQueryParams {
    return this.messageParams;
  }


  getAllMessages(): Observable<IContactUsMessage[]> {
    return this.http.get<IContactUsMessage[]>(`${this.baseUrl}/messages`);
  }

  getPaginatedMessages(): Observable<ContactUsMessagePagination> {
    let params = new HttpParams();

    const paramMappings: [keyof ContactUsMessageQueryParams, string][] = [
      ['sort', 'sort'],
      ['search', 'search'],
      ['sortDirection', 'sortDirection'],
      ['pageNumber', 'pageIndex'],
      ['pageSize', 'pageSize']
    ];

    paramMappings.forEach(([messageParamKey, paramName]) => {
      const value = this.messageParams[messageParamKey];
      if (value !== undefined && value !== 0 && value !== '') {
        params = params.append(paramName, value.toString());
      }
    });

    return this.http.get<ContactUsMessagePagination>(`${this.baseUrl}/paginated-messages`, { observe: 'response', params })
      .pipe(
        map(response => {
          this.pagination = response.body ?? ({} as ContactUsMessagePagination);
          return this.pagination;
        })
      );
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
