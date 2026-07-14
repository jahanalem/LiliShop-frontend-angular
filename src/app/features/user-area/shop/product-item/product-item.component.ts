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
