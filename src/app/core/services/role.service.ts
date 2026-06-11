import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IRole } from 'src/app/shared/models/role';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  getRoles(): Observable<IRole[]> {
    return this.http.get<IRole[]>(`${this.baseUrl}role/roles`);
  }
}
