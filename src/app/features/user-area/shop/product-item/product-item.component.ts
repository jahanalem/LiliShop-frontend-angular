
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { BasketService } from 'src/app/core/services/basket.service';
import { IProduct } from 'src/app/shared/models/product';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductItemComponent {
  product = input.required<IProduct>();

  private basketService = inject(BasketService);

  constructor() {

  }

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product());
  }
}
