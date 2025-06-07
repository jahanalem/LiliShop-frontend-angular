import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasketService } from 'src/app/core/services/basket.service';
import { IProduct } from 'src/app/shared/models/product';

@Component({
    selector: 'app-product-item',
    templateUrl: './product-item.component.html',
    styleUrls: ['./product-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatCardModule,
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
    const discount = this.product().discount;
    if (!discount?.isActive || !discount.startDate || !discount.endDate) {
      return false;
    }
    const now = Date.now();
    const start = new Date(discount.startDate).getTime();
    const end = new Date(discount.endDate).getTime();

    return now >= start && now <= end;
  });

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product());
  }
}
