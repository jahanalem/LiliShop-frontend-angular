import { ToastrService } from 'ngx-toastr';
import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpErrorResponse, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../services/utility-services/error.service';


export const errorInterceptor: HttpInterceptorFn = (request: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const toastr       = inject(ToastrService);
  const errorService = inject(ErrorService);

  return next(request).pipe(
    catchError((response: HttpErrorResponse) => {
      if (response.error instanceof ErrorEvent) {
        // A client-side or network error occurred.
        toastr.error("An unexpected error occurred.");
        return throwError(() => response);
      }
      // Delegate the server-side error handling to the error service
      errorService.handleError(response);
      return throwError(() => response);
    })
  );
};
