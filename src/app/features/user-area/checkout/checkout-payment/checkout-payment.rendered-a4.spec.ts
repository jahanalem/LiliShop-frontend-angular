import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CdkStepper } from '@angular/cdk/stepper';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { CheckoutPaymentComponent } from './checkout-payment.component';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
const stripeConstructor=vi.fn(function(){return stripe;});
const stripe={confirmCardPayment:vi.fn(),elements:()=>({create:()=>({mount:vi.fn(),on:vi.fn(),update:vi.fn(),destroy:vi.fn()})})};
@Component({selector:'app-text-input',template:'',inputs:['label','field']}) class TextFieldStub {}
describe('rendered A4 payment states',()=>{
  const ready={id:'saved',attemptId:'attempt',state:'Ready',orderId:1,expiresAt:'2026-10-23T06:20:00Z',subtotal:60,shipping:5,total:65,currency:'eur',reviewReason:null};
  function render(overrides:any={}) {
    const service={paymentConfiguration:vi.fn().mockReturnValue(of({publishableKey:'pk_test_deployment'})),retainedStatus:vi.fn().mockReturnValue(of(null)),prepareCheckout:vi.fn().mockReturnValue(of(ready)),
      confirmation:vi.fn().mockReturnValue(of({checkout:ready,clientSecret:'synthetic-secret'})),status:vi.fn().mockReturnValue(of(ready)),...overrides};
    const router={navigate:vi.fn()};
    TestBed.configureTestingModule({providers:[{provide:CdkStepper,useValue:{previous:vi.fn()}},
      {provide:CheckoutService,useValue:service},{provide:BasketService,useValue:{getCurrentBasketValue:()=>({id:'basket',items:[{id:1,productVariantId:2,quantity:2}]})}},
      {provide:NotificationService,useValue:{showError:vi.fn()}},{provide:TranslationService,useValue:{translate:(key:string)=>key}},
      {provide:ThemeService,useValue:{theme:signal('light')}},{provide:Router,useValue:router}]});
    TestBed.overrideComponent(CheckoutPaymentComponent,{remove:{imports:[TextInputComponent]},add:{imports:[TextFieldStub]}});
    const fixture=TestBed.createComponent(CheckoutPaymentComponent);
    fixture.componentRef.setInput('checkoutForm',{address:()=>({value:()=>({firstName:'Test',lastName:'Buyer',street:'Test',city:'Test',state:'Test',zipCode:'10000'})}),
      delivery:{deliveryMethod:()=>({value:()=>1})},payment:Object.assign(()=>({invalid:()=>false}),{nameOnCard:()=>({value:()=> 'Test'})})});
    fixture.detectChanges();const component=fixture.componentInstance;
    component.cardNumberValid.set(true);component.cardExpiryValid.set(true);component.cardCvcValid.set(true);fixture.detectChanges();
    return {fixture,component,service,router};
  }
  beforeEach(()=>{stripeConstructor.mockClear();vi.stubGlobal('Stripe',stripeConstructor);stripe.confirmCardPayment.mockReset();stripe.confirmCardPayment.mockResolvedValue({paymentIntent:{status:'succeeded'}});vi.useFakeTimers();});
  afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
  it('uses the server-selected public key before mounting Stripe',()=>{
    const {fixture,service}=render();
    expect(service.paymentConfiguration).toHaveBeenCalledOnce();
    expect(stripeConstructor).toHaveBeenCalledWith('pk_test_deployment');fixture.destroy();
  });
  it('waits for deployment configuration even when Stripe.js is already loaded',()=>{
    const config=new Subject<any>();const {fixture,component}=render({paymentConfiguration:()=>config});
    expect(stripeConstructor).not.toHaveBeenCalled();expect(component.cardNumber).toBeUndefined();
    config.next({publishableKey:'pk_test_anotherdeployment'});config.complete();
    expect(stripeConstructor).toHaveBeenCalledWith('pk_test_anotherdeployment');fixture.destroy();
  });
  it('keeps the form disabled when server configuration fails without falling back to a build-time key',()=>{
    const {fixture,component}=render({paymentConfiguration:()=>throwError(()=>new Error('offline'))});fixture.detectChanges();
    expect(stripeConstructor).not.toHaveBeenCalled();expect(component.cardNumber).toBeUndefined();
    expect(fixture.nativeElement.querySelector('button[mat-raised-button]').disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Payment form is temporarily unavailable');fixture.destroy();
  });
  it.each(['pk_live_synthetic','sk_test_private','pk_test_bad key'])('rejects invalid public configuration %s',publishableKey=>{
    const {fixture,component}=render({paymentConfiguration:()=>of({publishableKey})});
    expect(stripeConstructor).not.toHaveBeenCalled();expect(component.cardNumber).toBeUndefined();fixture.destroy();
  });
  it('cancels configuration loading when the checkout is destroyed',()=>{
    const config=new Subject<any>();const {fixture,component}=render({paymentConfiguration:()=>config});fixture.destroy();
    config.next({publishableKey:'pk_test_deferred'});config.complete();
    expect(stripeConstructor).not.toHaveBeenCalled();expect(component.cardNumber).toBeUndefined();
  });
  it('renders a disabled submit while preparation is pending and ignores repeated clicks',async()=>{
    const pending=new Subject<any>();const {fixture,component,service}=render({prepareCheckout:vi.fn().mockReturnValue(pending)});
    const submitted=component.submitOrder();await component.submitOrder();fixture.detectChanges();
    expect(service.prepareCheckout).toHaveBeenCalledTimes(1);expect(stripe.confirmCardPayment).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('button[mat-raised-button]').disabled).toBe(true);
    pending.next({...ready,state:'ReviewRequired'});pending.complete();await submitted;fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('needs review');expect(stripe.confirmCardPayment).not.toHaveBeenCalled();fixture.destroy();
  });
  it('waits for confirmation authorization and never navigates based on browser success',async()=>{
    const pending=new Subject<any>();const {fixture,component,service,router}=render({confirmation:vi.fn().mockReturnValue(pending)});
    const submitted=component.submitOrder();await Promise.resolve();await Promise.resolve();expect(service.confirmation).toHaveBeenCalledWith('saved');expect(stripe.confirmCardPayment).not.toHaveBeenCalled();
    pending.next({checkout:ready,clientSecret:'synthetic-secret'});pending.complete();await submitted;expect(stripe.confirmCardPayment).toHaveBeenCalledOnce();expect(router.navigate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(0);fixture.detectChanges();expect(router.navigate).not.toHaveBeenCalled();fixture.destroy();
  });
  it('renders paused starts without confirmation',async()=>{
    const {fixture,component}=render({prepareCheckout:vi.fn().mockReturnValue(throwError(()=>({error:{code:'checkout_paused'}})))});
    await component.submitOrder();fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('temporarily unavailable');expect(stripe.confirmCardPayment).not.toHaveBeenCalled();fixture.destroy();
  });
  it('restores status on reload without automatically charging',()=>{
    const {fixture,service}=render({retainedStatus:vi.fn().mockReturnValue(of({...ready,state:'ReviewRequired'}))});
    expect(service.retainedStatus).toHaveBeenCalled();expect(fixture.nativeElement.textContent).toContain('needs review');expect(stripe.confirmCardPayment).not.toHaveBeenCalled();fixture.destroy();
  });
  it('retains uncertainty and exposes no secret after server error',async()=>{
    const {fixture,component}=render({confirmation:vi.fn().mockReturnValue(throwError(()=>new Error('offline')))});
    await component.submitOrder();fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('status is uncertain');expect(fixture.nativeElement.textContent).not.toContain('synthetic-secret');expect(stripe.confirmCardPayment).not.toHaveBeenCalled();fixture.destroy();
  });
  it('observes server verification beyond the first thirty seconds',async()=>{
    const status=vi.fn().mockImplementation(()=>of(status.mock.calls.length>21?{...ready,state:'PaymentVerified'}:ready));
    const {fixture,component,router}=render({status});
    try {
      await component.submitOrder();await vi.advanceTimersByTimeAsync(46000);
      expect(router.navigate).toHaveBeenCalledWith(['checkout/success'],{queryParams:{checkout:'saved'}});
      expect(stripe.confirmCardPayment).toHaveBeenCalledOnce();
    } finally { fixture.destroy(); }
  });
  it('keeps submitted payment pending without another confirmation or paid claim',async()=>{
    const {fixture,component,service,router}=render();
    try {
      await component.submitOrder();await vi.advanceTimersByTimeAsync(2000);fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role=status]').textContent).toContain('Waiting for server confirmation');
      expect(fixture.nativeElement.querySelector('button[mat-raised-button]').disabled).toBe(true);
      await component.submitOrder();expect(service.prepareCheckout).toHaveBeenCalledOnce();
      expect(stripe.confirmCardPayment).toHaveBeenCalledOnce();expect(router.navigate).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(130000);const calls=service.status.mock.calls.length;
      await vi.advanceTimersByTimeAsync(60000);expect(service.status).toHaveBeenCalledTimes(calls);
      expect(fixture.nativeElement.textContent).toContain('Resume saved checkout');
    } finally { fixture.destroy(); }
  });
  it('mounts card fields when asynchronously loaded Stripe.js becomes ready',async()=>{
    vi.stubGlobal('Stripe',undefined);
    const {fixture,component}=render();
    try {
      expect(component.cardNumber).toBeUndefined();
      vi.stubGlobal('Stripe',function(){return stripe;});await vi.advanceTimersByTimeAsync(200);
      expect(component.cardNumber).toBeDefined();expect(component.cardNumber.mount).toHaveBeenCalledOnce();
    } finally {fixture.destroy();}
  });
  it('does not mount deferred card fields after the checkout is destroyed',async()=>{
    vi.stubGlobal('Stripe',undefined);
    const {fixture,component}=render();fixture.destroy();
    vi.stubGlobal('Stripe',function(){return stripe;});await vi.advanceTimersByTimeAsync(40000);
    expect(component.cardNumber).toBeUndefined();
  });
  it('navigates only when server status is PaymentVerified',async()=>{
    const {fixture,component,router}=render({status:vi.fn().mockReturnValue(of({...ready,state:'PaymentVerified'}))});
    await component.submitOrder();await vi.advanceTimersByTimeAsync(0);expect(router.navigate).toHaveBeenCalledWith(['checkout/success'],{queryParams:{checkout:'saved'}});fixture.destroy();
  });
});
