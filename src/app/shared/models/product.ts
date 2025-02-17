import { IProductPhoto } from './productPhoto';
import { IProductCharacteristic } from "./productCharacteristic";


export interface IProduct {
  id                    :  number;
  name                  :  string;
  description           :  string;
  price                 :  number;
  previousPrice         ?: number
  pictureUrl            :  string;
  productType           ?: string;
  productTypeId         ?: number;
  productBrand          ?: string;
  productBrandId        ?: number;
  isActive              :  boolean;
  isDiscountActive      ?: boolean;
  discountStartDate     ?: string | null;
  discountEndDate       ?: string | null;
  productCharacteristics:  IProductCharacteristic[];
  productPhotos         :  IProductPhoto[];
}
