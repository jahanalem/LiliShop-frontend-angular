import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CloudinaryImage } from '@cloudinary/url-gen';

import { BasketService } from 'src/app/core/services/basket.service';
import { IProduct } from 'src/app/shared/models/product';

@Component({
    selector: 'app-product-item',
    templateUrl: './product-item.component.html',
    styleUrls: ['./product-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ProductItemComponent implements OnInit {
  private basketService = inject(BasketService);

  product = input.required<IProduct>();

  publicId = signal<string>('');
  img      = signal<CloudinaryImage>({} as CloudinaryImage);

  ngOnInit() {
  }

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product());
  }

  discountActiveNow(): boolean {
    const prod = this.product();
    if (!prod.isDiscountActive || !prod.discountStartDate || !prod.discountEndDate) {
      return false;
    }
    const now   = new Date().getTime();
    const start = new Date(prod.discountStartDate).getTime();
    const end   = new Date(prod.discountEndDate).getTime();

    return now >= start && now <= end;
  }
}
