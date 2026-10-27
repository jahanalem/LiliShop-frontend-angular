import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HANDLE_ERROR_LOCALLY } from './local-error-handling';
import { errorInterceptor } from './error.interceptor';
import { ErrorService } from '../services/utility-services/error.service';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../i18n/translation.service';

describe('View-owned HTTP error states',()=>{
  it('keeps operations errors in the view while preserving legacy global handling',()=>{
    const global=vi.fn(),notify=vi.fn();
    TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([errorInterceptor])),provideHttpClientTesting(),
      {provide:ErrorService,useValue:{handleError:global}},{provide:NotificationService,useValue:{showError:notify}},
      {provide:TranslationService,useValue:{translate:(k:string)=>k}}]});
    const http=TestBed.inject(HttpClient),requests=TestBed.inject(HttpTestingController),local=vi.fn();
    http.get('/read-owned-by-view',{context:new HttpContext().set(HANDLE_ERROR_LOCALLY,true)}).subscribe({error:local});
    requests.expectOne('/read-owned-by-view').flush({}, {status:404,statusText:'Not found'});
    expect(local).toHaveBeenCalledOnce();expect(global).not.toHaveBeenCalled();expect(notify).not.toHaveBeenCalled();
    http.get('/legacy').subscribe({error:()=>{}});requests.expectOne('/legacy').flush({}, {status:404,statusText:'Not found'});
    expect(global).toHaveBeenCalledOnce();requests.verify();
  });
});
