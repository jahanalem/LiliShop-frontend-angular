import { Injectable } from '@angular/core';
import { CloudinaryImage } from '@cloudinary/url-gen';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { cloudinary } from './cloudinary.config';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
    generateImage(publicId: string, width: number, height: number): CloudinaryImage {
      return cloudinary
        .image(publicId)
        .resize(fill().width(width).height(height).gravity('auto'))
        .delivery(quality('auto'))
        .delivery(format('auto'));
    }
}