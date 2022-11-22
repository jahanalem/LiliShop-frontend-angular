import { IProductSize } from "./productSize";

export interface IProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  pictureUrl: string;
  productType: string;
  productTypeId?: number;
  productBrand: string;
  productBrandId?: number;
  isActive: boolean;
  productSizes: IProductSize[];
}
