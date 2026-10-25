import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CheckoutService } from './checkout.service';
import { AccountService } from './account.service';
import { BasketService } from './basket.service';

describe('deployment payment configuration', () => {
  it('reads the public key from the same backend without starting or confirming a checkout', () => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting(),
      {provide: AccountService, useValue: {}}, {provide: BasketService, useValue: {}},
      {provide: Router, useValue: {navigate: vi.fn()}}]});
    const service=TestBed.inject(CheckoutService);
    const http=TestBed.inject(HttpTestingController);
    let publicKey: string | undefined;
    service.paymentConfiguration().subscribe(config=>publicKey=config.publishableKey);
    const request=http.expectOne(req=>req.url.endsWith('/checkout/payment-configuration'));
    expect(request.request.method).toBe('GET');
    expect(request.request.body).toBeNull();
    request.flush({publishableKey:'pk_test_serverdeployment'});
    expect(publicKey).toBe('pk_test_serverdeployment');
    http.expectNone(req=>req.method!=='GET');http.verify();
  });
});
