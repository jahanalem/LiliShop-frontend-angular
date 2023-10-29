import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IRole } from 'src/app/shared/models/role';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getRoles(): Observable<IRole[]> {
    return this.http.get<IRole[]>(`${this.baseUrl}role/roles`);
  }
}
