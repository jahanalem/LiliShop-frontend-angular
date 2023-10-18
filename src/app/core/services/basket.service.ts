import { Basket, IBasketItem } from './../../shared/models/basket';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { IBasket, IBasketTotals } from 'src/app/shared/models/basket';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { IProduct } from 'src/app/shared/models/product';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';


@Injectable({
  providedIn: 'root'
})
export class BasketService {
  baseUrl = environment.apiUrl;
  /*
  BehaviorSubject is a special kind of Observable that allows for multicasting of the Observable itself and allows for multiple subscribers to list as well.
  And this is something we're going to make use of for our basket because a basket will need to be accessible by multiple different components.
*/
  private basketSource = new BehaviorSubject<IBasket | null>(null);
  basket$ = this.basketSource.asObservable();
  private basketTotalSource = new BehaviorSubject<IBasketTotals | null>(null);
  basketTotal$ = this.basketTotalSource.asObservable();
  shipping = 0;

  constructor(private http: HttpClient, private storageService:StorageService) {
    this.basketSource.asObservable()
  }

  createPaymentIntent() {
    return this.http.post<IBasket>(`${this.baseUrl}payments/${this.getCurrentBasketValue()?.id}`, {})
      .pipe(tap((basket: IBasket) => {
        this.basketSource.next(basket);
      }));
  }

  setShippingPrice(deliveryMethod: IDeliveryMethod): void {
    this.shipping = deliveryMethod.price;
    const basket = this.getCurrentBasketValue();
    if (!basket) {
      return;
    }
    basket.deliveryMethodId = deliveryMethod.id;
    basket.shippingPrice = deliveryMethod.price;
    this.calculateTotals();
    this.setBasket(basket).subscribe({
      next: () => console.log('Basket updated successfully'),
      error: (error) => console.log('An error occurred while updating basket', error)
    });
  }

  getBasket(id: string): Observable<IBasket> {
    return this.http.get<IBasket>(`${this.baseUrl}basket?id=${id}`).pipe(
      tap((basket: IBasket) => {
        this.basketSource.next(basket);
        this.shipping = basket.shippingPrice ?? 0;
        this.calculateTotals();
      })
    );
  }

  setBasket(basket: IBasket): Observable<IBasket> {
    return this.http.post<IBasket>(`${this.baseUrl}basket`, basket).pipe(
      tap((response: IBasket) => {
        this.basketSource.next(response);
        this.calculateTotals();
      }),
      catchError(error => {
        console.log(error);
        return throwError(() => error);
      })
    );
  }

  getCurrentBasketValue(): IBasket | null {
    return this.basketSource.value;
  }

  addItemToBasket(item: IProduct, quantity: number = 1) {
    const itemToAdd: IBasketItem = this.mapProductItemToBasketItem(item, quantity);
    const basket = this.getCurrentBasketValue() ?? this.createBasket();
    basket.items = this.addOrUpdateItem(basket.items!, itemToAdd, quantity);
    this.setBasket(basket).subscribe({
      next: () => console.log('Basket updated successfully'),
      error: (error) => console.log('An error occurred while updating basket', error)
    });
  }

  private addOrUpdateItem(items: IBasketItem[], itemToAdd: IBasketItem, quantity: number): IBasketItem[] {
    const index = items.findIndex(i => i.id === itemToAdd.id);
    if (index === -1) {
      itemToAdd.quantity = quantity;
      items.push(itemToAdd);
    }
    else {
      items[index].quantity += quantity;
    }

    return items;
  }

  private createBasket(): IBasket {
    const basket = new Basket();
    this.storageService.set('basket_id', basket.id);
    return basket;
  }

  private mapProductItemToBasketItem(item: IProduct, quantity: number): IBasketItem {
    return {
      id: item.id,
      productName: item.name,
      price: item.price,
      pictureUrl: item.pictureUrl,
      quantity,
      brand: item.productBrand ?? "UNKNOWN BRAND",
      type: item.productType ?? "UNKNOWN TYPE"
    };
  }

  private calculateTotals() {
    const basket = this.getCurrentBasketValue();
    if (!basket) {
      return;
    }
    const shipping = this.shipping;
    const subtotal = basket.items.reduce((a, b) => (b.price * b.quantity) + a, 0);
    const total = subtotal + shipping;
    this.basketTotalSource.next({ shipping, subtotal, total });
  }

  incrementItemQuantity(item: IBasketItem) {
    this.updateItemQuantity(item, item.quantity + 1);
  }

  decrementItemQuantity(item: IBasketItem) {
    this.updateItemQuantity(item, item.quantity - 1);
  }

  removeItemFromBasket(item: IBasketItem) {
    this.updateItemQuantity(item, 0);
  }

  deleteBasket(basket: IBasket): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}basket?id=${basket.id}`).pipe(
      tap(() => {
        this.basketSource.next(null);
        this.basketTotalSource.next(null);
        this.storageService.delete('basket_id');
      }),
      catchError((error) => {
        console.log(error);
        return throwError(() => error);
      })
    );
  }

  deleteLocalBasket(_id: string) {
    this.basketSource.next(null);
    this.basketTotalSource.next(null);
    this.storageService.delete('basket_id');
  }

  private updateItemQuantity(item: IBasketItem, newQuantity: number) {
    const basket = this.getCurrentBasketValue();
    if (!basket) {
      return;
    }
    const foundItemIndex = basket.items.findIndex(x => x.id === item.id);
    if (newQuantity > 0) {
      basket.items[foundItemIndex].quantity = newQuantity;
    } else {
      basket.items.splice(foundItemIndex, 1);
      if (basket.items.length === 0) {
        this.deleteBasket(basket).subscribe({
          next: () => console.log('Basket deleted'),
          error: (error: any) => { console.error('Error deleting basket:', error); },
        });
      }
    }
    this.setBasket(basket).subscribe({
      next: () => console.log('Basket updated successfully'),
      error: (error) => console.log('An error occurred while updating basket', error)
    });
  }
}
