import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CdkStepper } from '@angular/cdk/stepper';
import { Subject, of } from 'rxjs';
import { Router } from '@angular/router';
import { CheckoutPaymentComponent } from './checkout-payment.component';
import { BasketService } from 'src/app/core/services/basket.service';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { ThemeService } from 'src/app/core/services/theme.service';

describe('durable checkout sequencing regression', () => {
  it('does not confirm while server preparation is still pending', async () => {
    const pending = new Subject<any>();
    const basket = { id: 'checkout-test', clientSecret: 'synthetic-secret', items: [{id: 1, productVariantId: 1, quantity: 2}] };
    TestBed.configureTestingModule({providers: [
      {provide: CdkStepper, useValue: {next: vi.fn(), previous: vi.fn()}},
      {provide: BasketService, useValue: {getCurrentBasketValue: () => basket, deleteBasket: () => of(true)}},
      {provide: CheckoutService, useValue: {createOrder: () => pending, prepareCheckout: () => pending}},
      {provide: NotificationService, useValue: {showError: vi.fn()}},
      {provide: TranslationService, useValue: {translate: (key: string) => key}},
      {provide: ThemeService, useValue: {theme: signal('light')}},
      {provide: Router, useValue: {navigate: vi.fn()}}
    ]});
    const fixture = TestBed.createComponent(CheckoutPaymentComponent);
    fixture.componentRef.setInput('checkoutForm', {
      address: () => ({value: () => ({firstName:'Test',lastName:'Buyer',street:'Test',city:'Test',state:'Test',zipCode:'10000'})}),
      delivery: {deliveryMethod: () => ({value: () => 1})},
      payment: Object.assign(() => ({invalid: () => false}), {nameOnCard: () => ({value: () => 'Test'})})
    });
    const confirm = vi.fn().mockResolvedValue({error: {message:'Synthetic decline'}});
    fixture.componentInstance.stripe = {confirmCardPayment: confirm} as any;
    const submitted = fixture.componentInstance.submitOrder();
    try { expect(confirm).not.toHaveBeenCalled(); }
    finally { pending.error(new Error('Synthetic preparation failure')); await submitted; fixture.destroy(); }
  });
});
