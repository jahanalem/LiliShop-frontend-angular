import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { of, Observable, ReplaySubject, tap } from 'rxjs';
import { IAddress } from 'src/app/shared/models/address';
import { IUser } from 'src/app/shared/models/user';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { LOCAL_STORAGE_KEYS } from 'src/app/shared/constants/auth';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly baseUrl = environment.apiUrl;
  private currentUserSource = new ReplaySubject<IUser | null>(1);
  public currentUser$ = this.currentUserSource.asObservable();

  constructor(private http: HttpClient, private router: Router, private storageService: StorageService) { }

  loadCurrentUser(token: string | null): Observable<IUser | null> {
    if (token === null) {
      this.currentUserSource.next(null);
      return of(null);
    }
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${token}`);

    return this.http.get<IUser>(`${this.baseUrl}account/currentuser`, { headers }).pipe(
      tap((user: IUser) => {
        if (user) {
          this.storageService.set(LOCAL_STORAGE_KEYS.AUTH_TOKEN, user.token);
          this.currentUserSource.next(user);
        }
      })
    );
  }

  login(values: any): Observable<IUser> {
    return this.http.post<IUser>(`${this.baseUrl}account/login`, values).pipe(
      tap((user: IUser) => {
        if (user) {
          this.storageService.set(LOCAL_STORAGE_KEYS.AUTH_TOKEN, user.token);
          this.currentUserSource.next(user);
        }
      })
    );
  }

  register(values: any): Observable<IUser> {
    return this.http.post<IUser>(`${this.baseUrl}account/register`, values).pipe(
      tap((user: IUser) => {
        if (user) {
          this.storageService.set(LOCAL_STORAGE_KEYS.AUTH_TOKEN, user.token);
          this.currentUserSource.next(user);
        }
      })
    );
  }

  logout(): void {
    this.storageService.delete(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    this.currentUserSource.next(null);
    this.router.navigateByUrl('/');
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}account/emailexists?email=${email}`);
  }

  getUserAddress(): Observable<IAddress> {
    return this.http.get<IAddress>(`${this.baseUrl}account/address`);
  }

  updateAddress(address: IAddress): Observable<IAddress> {
    return this.http.put<IAddress>(`${this.baseUrl}account/address`, address);
  }
}
