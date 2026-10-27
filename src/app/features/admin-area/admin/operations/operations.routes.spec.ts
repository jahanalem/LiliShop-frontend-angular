import { HANDLE_ERROR_LOCALLY } from 'src/app/core/interceptors/local-error-handling';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { PolicyNames } from 'src/app/shared/models/policy';
import { ADMIN_ROUTES } from '../admin.routes';
import { OperationsListComponent } from './operations-list.component';

@Component({standalone:true,imports:[RouterOutlet],template:'<router-outlet />'}) class Shell {}
@Component({standalone:true,template:'Home'}) class Home {}

describe('Admin operations actual lazy routes and read contracts',()=>{
  let http:HttpTestingController;
  const now='2026-10-27T10:00:00Z';
  const id='22222222-2222-4222-8222-222222222222';
  const page={page:1,pageSize:25,count:0,asOf:now,data:[]};
  const row={id,orderId:null,attemptId:null,amountMinor:null,currency:null,verifiedAt:null,liveMode:null,createdAt:now,expiresAt:now,state:'Preparing',reason:null};
  function configure(role:string|null='SuperAdmin'){
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),
      provideRouter([{...ADMIN_ROUTES[0],path:'admin',component:Shell},{path:'account/login',component:Home},{path:'',pathMatch:'full',component:Home}]),
      {provide:AccountService,useValue:{currentUser$:new BehaviorSubject(role?{id:42,role}:null)}},
      {provide:AuthorizationService,useValue:{getPolicy:(p:string)=>of(p===PolicyNames.RequireSuperAdminRole?['SuperAdmin']:['Administrator','SuperAdmin'])}},
      {provide:TranslationService,useValue:{translate:(key:string)=>key}}
    ]});http=TestBed.inject(HttpTestingController);
  }
  function summary(){http.expectOne(r=>r.url.endsWith('/operations/summary')).flush({asOf:now,processingBacklog:0,inboxBacklog:0,checkoutReviews:0,mailUnknown:0});}
  afterEach(()=>{http?.verify();localStorage.clear();});

  it.each([null,'Customer','Administrator'])('blocks every operations route for %s',async role=>{
    configure(role);const h=await RouterTestingHarness.create();
    for(const path of ['checkouts','inbox','mail','controls','audit','orders/1']){
      await h.navigateByUrl('/admin/operations/'+path);
      expect(TestBed.inject(Router).url).not.toContain('/admin/operations');
    }
    http.expectNone(r=>r.url.includes('/operations/'));
  });
  it('distinguishes loading, no matches, real empty and forbidden while retaining filter context',async()=>{
    configure();const h=await RouterTestingHarness.create('/admin/operations/checkouts?search=missing&page=2');summary();
    h.detectChanges();expect(h.routeNativeElement?.textContent).toContain('Loading');
    const r=http.expectOne(r=>r.url.endsWith('/operations/checkouts'));expect(r.request.method).toBe('GET');expect(r.request.context.get(HANDLE_ERROR_LOCALLY)).toBe(true);expect(r.request.params.get('page')).toBe('2');
    r.flush({...page,page:2});h.detectChanges();expect(h.routeNativeElement?.textContent).toContain('No matching');
    await h.navigateByUrl('/admin/operations/checkouts');http.expectOne(r=>r.url.endsWith('/operations/checkouts')).flush(page);h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('No records');
    h.routeNativeElement!.querySelector<HTMLButtonElement>('.heading button')!.click();summary();
    http.expectOne(r=>r.url.endsWith('/operations/checkouts')).flush({}, {status:403,statusText:'Forbidden'});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('You do not have permission');http.expectNone(r=>r.method!=='GET');
  });
  it('cancels stale requests when filters change, preserves combined mail filters and detail links',async()=>{
    configure();const h=await RouterTestingHarness.create('/admin/operations/mail?state=Complete&mailState=UnknownDelivery');summary();
    const old=http.expectOne(r=>r.url.endsWith('/operations/mail'));expect(old.request.params.get('state')).toBe('Complete');expect(old.request.params.get('mailState')).toBe('UnknownDelivery');
    await h.navigateByUrl('/admin/operations/mail?state=Complete&mailState=ReviewRequired&page=2');expect(old.cancelled).toBe(true);
    http.expectOne(r=>r.url.endsWith('/operations/mail')).flush({...page,page:2,count:30,data:[{id,handoffId:id,orderId:12,invoiceId:77,state:'ReviewRequired',revision:4,attempts:2,processingState:'Complete',updatedAt:now,timing:'None',reason:'smtp_rejected'}]});
    h.detectChanges();expect(h.routeNativeElement?.textContent).toContain('smtp_rejected');
    const href=h.routeNativeElement!.querySelector<HTMLAnchorElement>(`a[href^="/admin/operations/mail/${id}"]`)!.href;
    expect(href).toContain('mailState=ReviewRequired');expect(href).toContain('returnTo=mail');
  });
  it('debounces targeted search without writes or losing independent filters',async()=>{
    configure();const h=await RouterTestingHarness.create('/admin/operations/mail?mailState=UnknownDelivery');summary();
    http.expectOne(r=>r.url.endsWith('/operations/mail')).flush(page);h.detectChanges();
    const component=h.fixture.debugElement.query(By.directive(OperationsListComponent)).componentInstance as OperationsListComponent;
    component.search('first');component.search('  invoice-42  ');
    http.expectNone(r=>r.url.endsWith('/operations/mail'));
    await new Promise(resolve=>setTimeout(resolve,420));await h.fixture.whenStable();
    const request=http.expectOne(r=>r.url.endsWith('/operations/mail'));expect(request.request.params.get('search')).toBe('invoice-42');expect(request.request.params.get('mailState')).toBe('UnknownDelivery');request.flush(page);
    http.expectNone(r=>r.method!=='GET');
  });
  it('shows missing attempts honestly and keeps provider minor units distinct',async()=>{
    configure();const h=await RouterTestingHarness.create('/admin/operations/checkouts/'+id);
    http.expectOne(r=>r.url.endsWith('/checkouts/'+id)).flush({checkout:row,money:null,paymentIntentId:null,verifiedEventId:null});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('No attempt');
    h.routeNativeElement!.querySelector<HTMLButtonElement>('.heading button')!.click();
    http.expectOne(r=>r.url.endsWith('/checkouts/'+id)).flush({checkout:{...row,attemptId:id,amountMinor:7510,currency:'jpy'},money:null});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('7,510 minor units');expect(h.routeNativeElement?.textContent).not.toContain('75.10');
  });
  it('renders saved USD, unavailable historical totals and only a validated invoice evidence link',async()=>{
    configure();const h=await RouterTestingHarness.create('/admin/operations/orders/12');
    http.expectOne(r=>r.url.endsWith('/orders/12')).flush({id:12,orderDate:now,status:'PaymentReceived',lines:[],money:{subtotal:60,shipping:null,total:null,currency:'usd',snapshotState:'Unresolved',complete:false,recordedAt:null,evidenceInvoiceId:null,evidenceStatus:'Unavailable'}});h.detectChanges();
    const text=h.routeNativeElement!.textContent!;expect(text).toContain('$60.00');expect(text).toContain('Historical money is unresolved');expect(text).toContain('Unavailable');expect(text).not.toContain('€');
    expect(h.routeNativeElement!.querySelector('a[href^="/admin/invoices/"]')).toBeNull();
    h.routeNativeElement!.querySelector<HTMLButtonElement>('.heading button')!.click();
    http.expectOne(r=>r.url.endsWith('/orders/12')).flush({}, {status:404,statusText:'Not found'});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('record is unavailable or does not exist');expect(h.routeNativeElement?.textContent).not.toContain('$60.00');
  });
  it('renders singleton controls without inventing a worker timestamp or writing activation',async()=>{
    configure();const h=await RouterTestingHarness.create('/admin/operations/controls');
    http.expectOne(r=>r.url.endsWith('/operations/controls')).flush({asOf:now,checkout:{newFlowEnabled:true,startsPaused:true,revision:9,changedBy:'operator',changedAt:now},worker:{enabled:false,revision:2}});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('no change timestamp');expect(h.routeNativeElement?.textContent).toContain('not proof');http.expectNone(r=>r.method!=='GET');
  });
});
