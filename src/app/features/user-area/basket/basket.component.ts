import { OrderTotalsComponent } from 'src/app/shared/components/order-totals/order-totals.component';
import { BasketSummaryComponent } from 'src/app/shared/components/basket-summary/basket-summary.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { BasketService } from 'src/app/core/services/basket.service';
import { IBasket, IBasketItem, IBasketTotals } from 'src/app/shared/models/basket';

@Component({
    selector: 'app-basket',
    templateUrl: './basket.component.html',
    styleUrls: ['./basket.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [RouterModule, OrderTotalsComponent, BasketSummaryComponent, MatButtonModule, MatIconModule, MatCardModule]
})
export class BasketComponent implements OnInit {
  private basketService = inject(BasketService);

  basket = signal<IBasket | null>(null);
  basketTotals = signal<IBasketTotals | null>(null);

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