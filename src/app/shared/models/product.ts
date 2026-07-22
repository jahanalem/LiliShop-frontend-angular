import { IProductPhoto } from './productPhoto';
import { ISingleDiscount } from './discount';

import { IProductTranslation } from './localization';

export interface IProduct {
  id                    :  number;
  name                  :  string;
  description           :  string;
  price                 :  number; // price is now ALWAYS the final, active price (discounted or original)
  previousPrice         ?: number; // previousPrice is populated ONLY if the item is currently on sale
  pictureUrl            :  string;
  picturePublicId       :  string;
  productType           ?: string;
  productTypeId         :  number;
  productBrand          ?: string;
  productBrandId        :  number;
  isActive              :  boolean;
  hasVariants           :  boolean;
  productPhotos         : IProductPhoto[];
  /** Per-culture content sent on save; loaded separately via getProductTranslations. */
  translations          ?: IProductTranslation[];
}

export interface IProductAdmin extends IProduct {
  discount       : Partial<ISingleDiscount> | null;
  scheduledPrice?: number;
}

