import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../services/utility-services/error.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private toastr: ToastrService, private errorService: ErrorService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((response: HttpErrorResponse) => {
        if (response.error instanceof ErrorEvent) {
          // A client-side or network error occurred.
          this.toastr.error("An unexpected error occurred.");
          return throwError(() => response);
        }

        // Delegate the server-side error handling to the error service
        this.errorService.handleError(response);
        return throwError(() => response);
      })
    );
  }
}
