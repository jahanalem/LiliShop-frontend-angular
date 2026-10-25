import { BasketService } from './basket.service';
import { AccountService } from './account.service';
import { CheckoutInput, CheckoutView, CheckoutConfirmation, CheckoutPaymentConfiguration } from 'src/app/shared/models/checkout';

import { catchError, map, Observable, of, from, firstValueFrom, switchMap, take, tap } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private http = inject(HttpClient);
  private account = inject(AccountService);
  private baskets = inject(BasketService);

  private readonly baseUrl: string = environment.apiUrl;
  private router = inject(Router);

  /**
   * Fetches available delivery methods from the server.
   *
   * Sends a GET request to fetch all available delivery methods and sorts them by price in descending order.
   *
   * @returns {Observable<IDeliveryMethod[]>} An Observable of an array of delivery methods.
   */
  getDeliveryMethods(): Observable<IDeliveryMethod[]> {
    const url = `${this.baseUrl}orders/deliveryMethods`;
    return this.http.get<IDeliveryMethod[]>(url).pipe(
      map((dm: IDeliveryMethod[]) => dm.sort((a, b) => b.price - a.price)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('User is not authenticated. Please log in.');
          this.router.navigate(['/account/login']);
        } else if (error.status === 404) {
          console.warn('No delivery methods found.');
        } else {
          console.error('An error occurred while fetching delivery methods:', error);
        }
        
        return of([]);
      })
    );
  }

  paymentConfiguration(): Observable<CheckoutPaymentConfiguration> {
    return this.http.get<CheckoutPaymentConfiguration>(`${this.baseUrl}checkout/payment-configuration`);
  }

  private async storageKey(): Promise<string> {
    const user = await firstValueFrom(this.account.currentUser$.pipe(take(1)));
    if (!user?.email || !user.token) throw new Error('Authentication required');
    return `lilishop.checkout.v1:${user.id ?? user.email.toLowerCase()}`;
  }

  prepareCheckout(input: CheckoutInput): Observable<CheckoutView> {
    return from(this.storageKey()).pipe(switchMap(key => {
      const normalized = {...input, lines: [...input.lines].sort((a,b) => a.productId-b.productId || (a.productVariantId??0)-(b.productVariantId??0))};
      const fingerprint = JSON.stringify(normalized);
      const saved = this.read(key);
      if (saved && saved.fingerprint !== fingerprint) throw {error: {code: 'checkout_input_changed'}};
      const identity = saved ?? {requestKey: crypto.randomUUID(), fingerprint, checkoutId: null};
      // Persist before the first HTTP request. An absent response never means the server did nothing.
      localStorage.setItem(key, JSON.stringify(identity));
      const result = identity.checkoutId ? this.http.post<CheckoutView>(`${this.baseUrl}checkout/${identity.checkoutId}/resume`, {})
        : this.http.post<CheckoutView>(`${this.baseUrl}checkout`, {...normalized, requestKey: identity.requestKey});
      return result.pipe(tap(view => localStorage.setItem(key, JSON.stringify({...identity, checkoutId: view.id}))));
    }));
  }
  private read(key: string): {requestKey: string; fingerprint: string; checkoutId: string|null}|null {
    const raw=localStorage.getItem(key);
    if (!raw) return null;
    const saved=JSON.parse(raw);
    if (typeof saved.requestKey !== 'string' || typeof saved.fingerprint !== 'string') throw new Error('Saved checkout identity is invalid');
    return saved;
  }
  retainedStatus(): Observable<CheckoutView|null> {
    return from(this.storageKey()).pipe(switchMap(key => {
      const id=this.read(key)?.checkoutId;
      return id ? this.status(id) : of(null);
    }));
  }
  status(id: string): Observable<CheckoutView> {
    return this.http.get<CheckoutView>(`${this.baseUrl}checkout/${id}`).pipe(tap(view => {
      if(view.state==='PaymentVerified') void this.finishVerified(view.id).catch(()=>{});
    }));
  }
  private async finishVerified(id: string): Promise<void> {
    const key=await this.storageKey();const saved=this.read(key);
    if(saved?.checkoutId!==id) return;
    const input=JSON.parse(saved.fingerprint) as CheckoutInput;
    const basket=this.baskets.getCurrentBasketValue();
    const actual=basket?.items.map(x=>({productId:x.id,productVariantId:x.productVariantId??undefined,quantity:x.quantity}))
      .sort((a,b)=>a.productId-b.productId || (a.productVariantId??0)-(b.productVariantId??0));
    // Clear only the basket that was paid for; preserve edits/new baskets made in another tab.
    if(basket?.id===input.basketId && JSON.stringify(actual)===JSON.stringify(input.lines))
      await firstValueFrom(this.baskets.deleteBasket(basket));
    if(this.read(key)?.checkoutId===id) localStorage.removeItem(key);
  }
  resumeSavedCheckout(): Observable<CheckoutView|null> {
    return from(this.storageKey()).pipe(switchMap(key=>{
      const saved=this.read(key);if(!saved) return of(null);
      const result=saved.checkoutId ? this.http.post<CheckoutView>(`${this.baseUrl}checkout/${saved.checkoutId}/resume`,{})
        : this.http.post<CheckoutView>(`${this.baseUrl}checkout`,{...JSON.parse(saved.fingerprint),requestKey:saved.requestKey});
      return result.pipe(tap(view=>localStorage.setItem(key,JSON.stringify({...saved,checkoutId:view.id}))));
    }));
  }
  confirmation(id: string): Observable<CheckoutConfirmation> {
    return this.http.post<CheckoutConfirmation>(`${this.baseUrl}checkout/${id}/confirmation`, {});
  }
  cancelSavedCheckout(): Observable<CheckoutView|null> {
    return from(this.storageKey()).pipe(switchMap(key => {
      const saved=this.read(key);
      // With no server response the original key must first be replayed, not discarded.
      if (saved && !saved.checkoutId) throw {error: {code:'checkout_outcome_uncertain'}};
      return saved?.checkoutId ? this.http.post<CheckoutView>(`${this.baseUrl}checkout/${saved.checkoutId}/cancel`, {})
        .pipe(tap(view => { if (view.state==='Cancelled') localStorage.removeItem(key); })) : of(null);
    }));
  }
}
