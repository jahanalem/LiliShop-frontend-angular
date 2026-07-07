import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { LOCAL_STORAGE_KEYS } from 'src/app/shared/constants/auth';
import { AccountService } from '../services/account.service';
import { TokenService } from '../services/token.service';
import { environment } from 'src/environments/environment';


export const jwtInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const accountService = inject(AccountService);
  const storageService = inject(StorageService);
  const tokenService = inject(TokenService);

  // Only attach credentials to requests aimed at our own API. Without this
  // check the bearer token would be sent to any host reached via HttpClient.
  const isApiRequest = request.url.startsWith(environment.apiUrl);

  // Pre-authentication endpoints. A 401 from these means "bad credentials / wrong
  // MFA code / admin blocked" — NOT "session expired", so we must not attempt a
  // silent token refresh + retry (that would swallow the error and force a logout
  // redirect, breaking the MFA and Google flows). Let their 401 reach the caller.
  const isAuthEndpoint = [
    'account/login',
    'account/mfa/',
    'account/google-login',
    'account/register',
    'account/forgot-password',
    'account/reset-password',
    'account/refresh-token',
  ].some((path) => request.url.includes(path));

  const token = storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);

  if (token && isApiRequest) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: any) => {
      if (error.status === 401 && isApiRequest && !isAuthEndpoint) {
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
