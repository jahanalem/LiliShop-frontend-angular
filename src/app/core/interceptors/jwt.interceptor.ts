import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { LOCAL_STORAGE_KEYS } from 'src/app/shared/constants/auth';
import { AccountService } from '../services/account.service';
import { TokenService } from '../services/token.service';


export const jwtInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const accountService = inject(AccountService);
  const storageService = inject(StorageService);
  const tokenService = inject(TokenService);

  const token = storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);

  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: any) => {
      if (error.status === 401) {
        if (tokenService.isRefreshing()) {
          return tokenService.getRefreshTokenSubject().pipe(
            switchMap((newToken) => {
              if (newToken) {
                request = request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                });
              }
              return next(request);
            })
          );
        }

        // Otherwise, start refreshing the token
        tokenService.setRefreshing(true);

        // Token expired, try refreshing
        return accountService.refreshToken().pipe(
          switchMap((newToken) => {
            tokenService.setRefreshing(false);
            tokenService.setNewToken(newToken);
            // Save the new access token in localStorage
            storageService.set(LOCAL_STORAGE_KEYS.AUTH_TOKEN, newToken);

            // Retry the failed request with the new token
            request = request.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(request);
          }),
          catchError(refreshError => {
            console.error('Refresh token failed:', refreshError);
            tokenService.setRefreshing(false);
            accountService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      if (error.status === 404) {
        console.warn('Resource not found:', error.url);
      }

      return throwError(() => error);
    })
  );
};
