import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BasketService } from 'src/app/core/services/basket.service';
import { IProduct } from 'src/app/shared/models/product';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
    selector: 'app-product-item',
    templateUrl: './product-item.component.html',
    styleUrls: ['./product-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TranslatePipe, 
        CurrencyPipe,
        MatIconModule,
        MatButtonModule,
        RouterModule,
        NgOptimizedImage,
    ]
})
export class ProductItemComponent {
  protected readonly TranslationKeys = TranslationKeys;

  private basketService = inject(BasketService);

  product    = input.required<IProduct>();
  isPriority = input<boolean>(false);

  /**
   * "matched picture ?? default picture": when attribute filters are active the backend nominates the
   * photo whose tags match them, so a Yellow filter shows the yellow shot instead of the default one.
   * Falls back to the product's default picture whenever nothing matched (or no filter is active).
   */
  readonly imageUrl = computed(() => {
    const product = this.product();
    return product.matchedPicturePublicId
      || product.matchedPictureUrl
      || product.picturePublicId
      || product.pictureUrl;
  });

  readonly isDiscountActive = computed(() => {
    return !!this.product().previousPrice;
  });

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product());
  }
}
