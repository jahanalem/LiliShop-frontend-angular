import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CheckoutService } from './checkout.service';
import { AccountService } from './account.service';
import { BasketService } from './basket.service';
import { CheckoutInput } from 'src/app/shared/models/checkout';

describe('durable checkout browser identity',()=>{
  let service:CheckoutService;let http:HttpTestingController;let user:BehaviorSubject<any>;let basket:any;let cleanup:ReturnType<typeof vi.fn>;
  const input:CheckoutInput={basketId:'basket',deliveryMethodId:1,shipToAddress:{firstName:'Test',lastName:'Buyer',street:'Test',city:'Test',state:'Test',zipCode:'10000'},lines:[{productId:1,productVariantId:2,quantity:1}]};
  beforeEach(()=>{localStorage.clear();basket=null;cleanup=vi.fn().mockReturnValue(of(undefined));user=new BehaviorSubject({id:1,email:'test@example.test',token:'synthetic'});
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([]),{provide:AccountService,useValue:{currentUser$:user}},{provide:BasketService,useValue:{getCurrentBasketValue:()=>basket,deleteBasket:cleanup}}]});
    service=TestBed.inject(CheckoutService);http=TestBed.inject(HttpTestingController);});
  afterEach(()=>{http.verify();localStorage.clear();});
  async function tick(){await Promise.resolve();await Promise.resolve();}
  it('reuses the same request key after a lost response',async()=>{
    service.prepareCheckout(input).subscribe({error:()=>{}});await tick();const first=http.expectOne(r=>r.url.endsWith('/checkout'));const key=first.request.body.requestKey;
    first.error(new ProgressEvent('offline'));service.prepareCheckout(input).subscribe();await tick();const retry=http.expectOne(r=>r.url.endsWith('/checkout'));
    expect(retry.request.body.requestKey).toBe(key);retry.flush({id:'saved',state:'Preparing'});
    expect(localStorage.getItem('lilishop.checkout.v1:1')).not.toContain('clientSecret');
  });
  it('reload resumes the saved checkout and does not start another',async()=>{
    service.prepareCheckout(input).subscribe();await tick();http.expectOne(r=>r.url.endsWith('/checkout')).flush({id:'saved',state:'Ready'});
    service.prepareCheckout(input).subscribe();await tick();http.expectOne(r=>r.url.endsWith('/checkout/saved/resume')).flush({id:'saved',state:'Ready'});
  });
  it('rejects changed purchase identity before a network request',async()=>{
    service.prepareCheckout(input).subscribe();await tick();http.expectOne(r=>r.url.endsWith('/checkout')).flush({id:'saved',state:'Ready'});
    const failure=vi.fn();service.prepareCheckout({...input,deliveryMethodId:2}).subscribe({error:failure});await tick();expect(failure).toHaveBeenCalled();http.expectNone(r=>r.url.includes('/checkout'));
  });
  it('isolates saved identities between authenticated owners',async()=>{
    service.prepareCheckout(input).subscribe();await tick();const first=http.expectOne(r=>r.url.endsWith('/checkout'));const key=first.request.body.requestKey;first.flush({id:'saved',state:'Ready'});
    user.next({id:2,email:'other@example.test',token:'synthetic'});service.prepareCheckout(input).subscribe();await tick();const other=http.expectOne(r=>r.url.endsWith('/checkout'));expect(other.request.body.requestKey).not.toBe(key);other.flush({id:'other',state:'Ready'});
  });
  it('does not discard an uncertain request on cancel',async()=>{
    service.prepareCheckout(input).subscribe({error:()=>{}});await tick();http.expectOne(r=>r.url.endsWith('/checkout')).error(new ProgressEvent('offline'));
    const failure=vi.fn();service.cancelSavedCheckout().subscribe({error:failure});await tick();expect(failure).toHaveBeenCalled();expect(localStorage.getItem('lilishop.checkout.v1:1')).not.toBeNull();
  });
  it('resolves a lost response with the original saved purchase before cancellation',async()=>{
    service.prepareCheckout(input).subscribe({error:()=>{}});await tick();const first=http.expectOne(r=>r.url.endsWith('/checkout'));const original=first.request.body;first.error(new ProgressEvent('offline'));
    service.resumeSavedCheckout().subscribe();await tick();const resume=http.expectOne(r=>r.url.endsWith('/checkout'));expect(resume.request.body).toEqual(original);resume.flush({id:'saved',state:'Ready'});
    expect(JSON.parse(localStorage.getItem('lilishop.checkout.v1:1')!).checkoutId).toBe('saved');
  });
  it('clears only the paid basket after server verification',async()=>{
    basket={id:'basket',items:[{id:1,productVariantId:2,quantity:1}]};
    service.prepareCheckout(input).subscribe();await tick();http.expectOne(r=>r.url.endsWith('/checkout')).flush({id:'saved',state:'Ready'});
    service.status('saved').subscribe();http.expectOne(r=>r.url.endsWith('/checkout/saved')).flush({id:'saved',state:'Ready'});await tick();expect(cleanup).not.toHaveBeenCalled();
    service.status('saved').subscribe();http.expectOne(r=>r.url.endsWith('/checkout/saved')).flush({id:'saved',state:'PaymentVerified'});await tick();await tick();
    expect(cleanup).toHaveBeenCalledWith(basket);expect(localStorage.getItem('lilishop.checkout.v1:1')).toBeNull();
  });
  it('preserves a basket edited after checkout preparation',async()=>{
    service.prepareCheckout(input).subscribe();await tick();http.expectOne(r=>r.url.endsWith('/checkout')).flush({id:'saved',state:'Ready'});
    basket={id:'basket',items:[{id:1,productVariantId:2,quantity:3}]};
    service.status('saved').subscribe();http.expectOne(r=>r.url.endsWith('/checkout/saved')).flush({id:'saved',state:'PaymentVerified'});await tick();
    expect(cleanup).not.toHaveBeenCalled();expect(localStorage.getItem('lilishop.checkout.v1:1')).toBeNull();
  });
  it('retains the verified identity if paid-basket cleanup fails',async()=>{
    basket={id:'basket',items:[{id:1,productVariantId:2,quantity:1}]};cleanup.mockReturnValue(throwError(()=>new Error('offline')));
    service.prepareCheckout(input).subscribe();await tick();http.expectOne(r=>r.url.endsWith('/checkout')).flush({id:'saved',state:'Ready'});
    service.status('saved').subscribe();http.expectOne(r=>r.url.endsWith('/checkout/saved')).flush({id:'saved',state:'PaymentVerified'});await tick();await tick();
    expect(localStorage.getItem('lilishop.checkout.v1:1')).not.toBeNull();
  });

});
