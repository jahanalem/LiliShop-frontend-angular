import { IProductPhoto } from './productPhoto';
import { IProductCharacteristic } from "./productCharacteristic";
import { ISingleDiscount } from './discount';

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
  productCharacteristics: IProductCharacteristic[];
  productPhotos         : IProductPhoto[];
}

export interface IProductAdmin extends IProduct {
  discount       : Partial<ISingleDiscount> | null;
  scheduledPrice?: number;
}

