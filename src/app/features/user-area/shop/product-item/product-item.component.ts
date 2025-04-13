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
    const discount = prod.discount;
    if(!discount){
      return false;
    }
    if ((!discount.isActive || !discount.startDate || !discount.endDate)) {
      return false;
    }

    const now   = new Date().getTime();
    const start = new Date(discount.startDate).getTime();
    const end   = new Date(discount.endDate).getTime();

    return now >= start && now <= end;
  }
}
