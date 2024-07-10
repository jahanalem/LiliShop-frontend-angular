import { IOrderItem } from 'src/app/shared/models/order';
import { IBasketItem } from './../../models/basket';
import { Component, OnInit, ChangeDetectionStrategy, output, input } from '@angular/core';

@Component({
  selector: 'app-basket-summary',
  templateUrl: './basket-summary.component.html',
  styleUrls: ['./basket-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasketSummaryComponent implements OnInit {
  isBasket  = input<boolean>(true);
  isOrder   = input<boolean>(false);
  items     = input<IBasketItem[] | IOrderItem[] | any[]>([]);
  decrement = output<IBasketItem>();
  increment = output<IBasketItem>();
  remove    = output<IBasketItem>();

  constructor() { }

  ngOnInit(): void {
  }

  decrementItemQuantity(item: IBasketItem) {
    this.decrement.emit(item);
  }
  incrementItemQuantity(item: IBasketItem) {
    this.increment.emit(item);
  }
  removeBasketItem(item: IBasketItem) {
    this.remove.emit(item);
  }
}
