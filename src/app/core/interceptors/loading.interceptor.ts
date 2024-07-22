import { inject } from '@angular/core';
import { HttpRequest, HttpEvent, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { BusyService } from '../services/busy.service';


export const loadingInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const busyService = inject(BusyService);
  
  if (request.method === 'POST' && request.url.includes('orders')) {
    return next(request);
  }
  if (request.url.includes('emailexists')) {
    return next(request);
  }
  busyService.busy();

  return next(request).pipe(finalize(() => { busyService.idle() }));
}
