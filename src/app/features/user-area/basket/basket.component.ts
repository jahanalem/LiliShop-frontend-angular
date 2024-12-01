import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { BasketService } from 'src/app/core/services/basket.service';
import { IBasket, IBasketItem, IBasketTotals } from 'src/app/shared/models/basket';

@Component({
    selector: 'app-basket',
    templateUrl: './basket.component.html',
    styleUrls: ['./basket.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class BasketComponent implements OnInit {
  basket = signal<IBasket | null>(null);
  basketTotals = signal<IBasketTotals | null>(null);

  constructor(private basketService: BasketService) { }

  ngOnInit(): void {
    this.basketService.basket$.subscribe(basket => this.basket.set(basket));
    this.basketService.basketTotal$.subscribe(totals => this.basketTotals.set(totals));
  }

  removeBasketItem(item: IBasketItem) {
    this.basketService.removeItemFromBasket(item);
  }

  incrementItemQuantity(item: IBasketItem) {
    this.basketService.incrementItemQuantity(item);
  }

  decrementItemQuantity(item: IBasketItem) {
    this.basketService.decrementItemQuantity(item);
  }

}
