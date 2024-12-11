import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private refreshingToken = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  isRefreshing(): boolean {
    return this.refreshingToken;
  }

  setRefreshing(value: boolean): void {
    this.refreshingToken = value;
  }

  getRefreshTokenSubject(): Observable<string | null> {
    return this.refreshTokenSubject.asObservable();
  }

  setNewToken(token: string | null): void {
    this.refreshTokenSubject.next(token);
  }
}
