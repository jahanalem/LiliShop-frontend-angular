import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BasketService } from 'src/app/core/services/basket.service';
import { IProduct } from 'src/app/shared/models/product';

@Component({
    selector: 'app-product-item',
    templateUrl: './product-item.component.html',
    styleUrls: ['./product-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CurrencyPipe,
        MatIconModule,
        MatButtonModule,
        RouterModule,
        NgOptimizedImage,
    ]
})
export class ProductItemComponent {
  private basketService = inject(BasketService);

  product    = input.required<IProduct>();
  isPriority = input<boolean>(false);

  readonly imageUrl = computed(() => {
    return this.product().picturePublicId ?? this.product().pictureUrl;
  });

  readonly isDiscountActive = computed(() => {
    return !!this.product().previousPrice;
  });

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product());
  }
}
