import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { PolicyNames } from 'src/app/shared/models/policy';
import { ADMIN_ROUTES } from '../admin.routes';
import { USER_LAYOUT_ROUTES } from 'src/app/features/user-area/user-layout.routes';

@Component({standalone:true, imports:[RouterOutlet], template:'<router-outlet />'}) class Shell {}
@Component({standalone:true, template:'Home'}) class Home {}
@Component({standalone:true, template:'Sign in'}) class Login {}

describe('A5 actual admin and customer routes', () => {
  let http: HttpTestingController;
  const id = '22222222-2222-4222-8222-222222222222';
  const detail = {id,orderId:12,attemptId:'attempt',createdAt:'2026-10-23T10:00:00Z',totalLines:2,lines:[],audit:[],
    execution:{state:'Retry',stage:'Inventory',revision:4,attempts:2,nextAttemptAt:'2026-10-23T10:00:00Z',invoiceId:null},email:null};
  function configure(role: string|null = 'SuperAdmin') {
    const checkout = USER_LAYOUT_ROUTES[0].children!.find(x => x.path === 'checkout')!;
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),
      provideRouter([{...ADMIN_ROUTES[0],path:'admin',component:Shell}, {...checkout},
        {path:'account/login',component:Login},{path:'',pathMatch:'full',component:Home}]),
      {provide:AccountService,useValue:{currentUser$:new BehaviorSubject(role ? {id:42,email:'buyer@example.test',token:'synthetic',role} : null)}},
      {provide:AuthorizationService,useValue:{getPolicy:(policy:string)=>of(policy===PolicyNames.RequireSuperAdminRole ? ['SuperAdmin'] : ['Administrator','SuperAdmin'])}},
      {provide:MatDialog,useValue:{open:vi.fn()}},
      {provide:TranslationService,useValue:{translate:(key:string)=>key}},
      {provide:BasketService,useValue:{getCurrentBasketValue:()=>null}}
    ]});
    http=TestBed.inject(HttpTestingController);
  }
  function control() { http.expectOne(r=>r.url.endsWith('/fulfillment/control')).flush({enabled:false,revision:3}); }
  afterEach(()=>{http?.verify();localStorage.clear();});

  it.each([null,'Customer','Administrator'])('protects the actual admin lazy route from %s',async role=>{
    configure(role);const h=await RouterTestingHarness.create();await h.navigateByUrl('/admin/fulfillment');
    expect(TestBed.inject(Router).url).not.toBe('/admin/fulfillment');http.expectNone(r=>r.url.includes('/fulfillment'));
  });
  it('renders the real paginated list and sends its filter to the server',async()=>{
    configure();const h=await RouterTestingHarness.create('/admin/fulfillment');control();
    const first=http.expectOne(r=>r.url.endsWith('/fulfillment'));expect(first.request.params.get('page')).toBe('1');
    first.flush({page:1,pageSize:25,count:1,data:[{...detail,state:'Retry',stage:'Inventory',emailState:'Pending'}]});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('Retry scheduled');
    const select=h.routeNativeElement!.querySelector('select')!;select.value='ReviewRequired';select.dispatchEvent(new Event('change'));h.detectChanges();
    const filtered=http.expectOne(r=>r.url.endsWith('/fulfillment'));expect(filtered.request.params.get('state')).toBe('ReviewRequired');
    filtered.flush({page:1,pageSize:25,count:0,data:[]});
  });
  it('requires reason and revision and suppresses repeated retry clicks',async()=>{
    configure();const h=await RouterTestingHarness.create(`/admin/fulfillment/${id}`);control();
    http.expectOne(r=>r.url.endsWith(`/fulfillment/${id}`)).flush(detail);h.detectChanges();
    const buttons=()=>Array.from(h.routeNativeElement!.querySelectorAll('button'));
    let retry=buttons().find(b=>b.textContent?.trim()==='Retry processing')!;expect(retry.disabled).toBe(true);
    const input=h.routeNativeElement!.querySelector('input')!;input.value='Investigated failure';input.dispatchEvent(new Event('input'));h.detectChanges();
    retry=buttons().find(b=>b.textContent?.trim()==='Retry processing')!;retry.click();retry.click();h.detectChanges();
    const request=http.expectOne(r=>r.url.endsWith('/retry'));expect(request.request.body).toEqual({revision:4,reason:'Investigated failure',email:false});
    request.flush({code:'work_retry_conflict'},{status:409,statusText:'Conflict'});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('Refresh the current state');
  });
  it('shows uncertain email with invoice access and no permitted resend',async()=>{
    configure();const h=await RouterTestingHarness.create(`/admin/fulfillment/${id}`);control();
    http.expectOne(r=>r.url.endsWith(`/fulfillment/${id}`)).flush({...detail,execution:{...detail.execution,state:'Complete',invoiceId:77},
      email:{id:'mail',state:'UnknownDelivery',revision:7,attempts:1}});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('Automatic resend is disabled');
    expect(h.routeNativeElement?.querySelector('a[href="/admin/invoices/77"]')).not.toBeNull();
    const button=Array.from(h.routeNativeElement!.querySelectorAll('button')).find(b=>b.textContent?.includes('Retry known email'))!;
    expect(button.disabled).toBe(true);http.expectNone(r=>r.method==='POST');
  });
  it('changes only the separately revisioned worker control',async()=>{
    configure();const h=await RouterTestingHarness.create('/admin/fulfillment');control();
    http.expectOne(r=>r.url.endsWith('/fulfillment')).flush({page:1,pageSize:25,count:0,data:[]});h.detectChanges();
    const input=h.routeNativeElement!.querySelector('input')!;input.value='Isolated validation';input.dispatchEvent(new Event('input'));h.detectChanges();
    Array.from(h.routeNativeElement!.querySelectorAll('button')).find(b=>b.textContent?.includes('Enable isolated worker'))!.click();
    const request=http.expectOne(r=>r.method==='PUT');expect(request.request.url).toContain('/fulfillment/control');
    expect(request.request.body).toEqual({revision:3,enabled:true,reason:'Isolated validation'});request.flush({enabled:true,revision:4});
    http.expectOne(r=>r.url.endsWith('/fulfillment')).flush({page:1,pageSize:25,count:0,data:[]});
    http.expectNone(r=>r.url.includes('/checkout'));
  });
  it('loads customer completion and uncertain mail from authorized reads without resubmitting payment',async()=>{
    configure('Customer');const h=await RouterTestingHarness.create(`/checkout/success?checkout=${id}`);
    http.expectOne(r=>r.url.endsWith(`/checkout/${id}`)).flush({id,state:'PaymentVerified',orderId:12});
    http.expectOne(r=>r.url.endsWith('/fulfillment/orders/12')).flush({orderId:12,paymentReceived:true,processing:'Complete',completedLines:2,totalLines:2,invoiceId:77,email:'UnknownDelivery'});
    h.detectChanges();expect(h.routeNativeElement?.textContent).toContain('Payment received');
    expect(h.routeNativeElement?.textContent).toContain('Inventory processing is complete');
    expect(h.routeNativeElement?.textContent).toContain('email outcome is uncertain');
    expect(h.routeNativeElement?.textContent).not.toContain('delivered');
    expect(h.routeNativeElement?.querySelector('a[href="/orders/12"]')).not.toBeNull();http.expectNone(r=>r.method!=='GET');
  });
  it('keeps known payment separate when processing access fails and clears stale order on payment auth failure',async()=>{
    configure('Customer');const h=await RouterTestingHarness.create(`/checkout/success?checkout=${id}`);
    http.expectOne(r=>r.url.endsWith(`/checkout/${id}`)).flush({id,state:'PaymentVerified',orderId:12});
    http.expectOne(r=>r.url.endsWith('/fulfillment/orders/12')).flush({}, {status:404,statusText:'Not found'});h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('Payment received');expect(h.routeNativeElement?.textContent).toContain('processing status is currently unavailable');
    h.routeNativeElement!.querySelector('button')!.click();
    http.expectOne(r=>r.url.endsWith(`/checkout/${id}`)).flush({}, {status:401,statusText:'Unauthorized'});h.detectChanges();
    expect(h.routeNativeElement?.textContent).not.toContain('Payment received');expect(h.routeNativeElement?.querySelector('a[href="/orders/12"]')).toBeNull();
  });
});
