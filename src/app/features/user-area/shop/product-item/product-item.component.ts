import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CloudinaryImage } from '@cloudinary/url-gen';

import { BasketService } from 'src/app/core/services/basket.service';
import { CloudinaryService } from 'src/app/core/services/cloudinary.service';
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
export class ProductItemComponent implements OnInit {
  private basketService     = inject(BasketService);
  private cloudinaryService = inject(CloudinaryService);

  product    = input.required<IProduct>();
  isPriority = input<boolean>(false);

  publicId = signal<string>('');

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

  cldImage = signal<CloudinaryImage>({} as CloudinaryImage);

  ngOnInit() {
    const publicId = this.product().picturePublicId;

    if (publicId) {
      this.publicId.set(publicId);
      const image = this.cloudinaryService.generateImage(publicId, 287, 287);
      this.cldImage.set(image);
    }
  }

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product());
  }
}
