import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { LOCAL_STORAGE_KEYS } from 'src/app/shared/constants/auth';


export const jwtInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const storageService = inject(StorageService);
  const token = storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);

  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(catchError((error: any) => { return throwError(() => error); }));
};
