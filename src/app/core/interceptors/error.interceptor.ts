import { ToastrService } from 'ngx-toastr';
import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpErrorResponse, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../services/utility-services/error.service';

export const errorInterceptor: HttpInterceptorFn = (request: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const toastr = inject(ToastrService);
  const errorService = inject(ErrorService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
       // Skip 401 errors as they are handled by jwtInterceptor
       if (error.status === 401) {
        return throwError(() => error);
      }
      if (error.error instanceof ErrorEvent) {
        toastr.error('An unexpected client-side error occurred.');
        return throwError(() => new Error('Client-side error: ' + error.message));
      }

      errorService.handleError(error);

      return throwError(() => error);
    })
  );
};
