import { IProductPhoto } from './productPhoto';
import { IProductCharacteristic } from "./productCharacteristic";
import { IDiscount } from './discount';

export interface IProduct {
  id                    :  number;
  name                  :  string;
  description           :  string;
  price                 :  number;
  previousPrice         ?: number;
  scheduledPrice        ?: number;
  currentDiscountedPrice?: number;
  pictureUrl            :  string;
  productType           ?: string;
  productTypeId         :  number;
  productBrand          ?: string;
  productBrandId        :  number;
  isActive              :  boolean;
  discount              : Partial<IDiscount> | null;
  productCharacteristics: IProductCharacteristic[];
  productPhotos         : IProductPhoto[];
}

