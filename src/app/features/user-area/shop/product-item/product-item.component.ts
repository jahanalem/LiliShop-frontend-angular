
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { Cloudinary, CloudinaryImage } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { auto } from '@cloudinary/url-gen/qualifiers/quality';
import { BasketService } from 'src/app/core/services/basket.service';
import { IProduct } from 'src/app/shared/models/product';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductItemComponent implements OnInit {
  product = input.required<IProduct>();
  img = signal<CloudinaryImage>({} as CloudinaryImage);
  private basketService = inject(BasketService);

  constructor() {

  }

  ngOnInit() {

  }

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product());
  }

  ApplyCloudinaryImage(){
    //TODO: use Cloudinary for showing the image insted of img HTML tag
    const cloudinary = new Cloudinary({
      cloud: {
        cloudName: 'rouhi'
      }
    });
    const publicID = this.extractPublicID(this.product().pictureUrl);
    const cloudinaryImage = cloudinary.image(publicID)
      .resize(fill()
        .width(287)
        .height(287)
        .gravity("auto")).format(auto())
    this.img.set(cloudinaryImage);
  }
  extractPublicID(url: string): string {
    // Extract the publicID from the URL (https://res.cloudinary.com/rouhi/image/upload/v1697284948/lili-shop/s3lezkmfi2t264djzgn8.png)
    const parts = url.split('/');
    const publicIDWithExt = parts.slice(7).join('/');
    const publicID = publicIDWithExt.replace(/\.[^/.]+$/, ""); // Remove the file extension
    return publicID;
  }
}
