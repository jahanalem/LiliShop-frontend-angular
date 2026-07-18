import { INameTranslation } from './localization';
import { IPaginationParams } from './queryParams';
import { PaginationWithData } from './pagination';

/** Mirrors LiliShop.Domain.Enums.AttributeInputType (serialized as enum member names). */
export type AttributeInputType = 'Select' | 'MultiSelect';

/** Mirrors LiliShop.Domain.Enums.AttributeSwatchType (serialized as enum member names). */
export type AttributeSwatchType = 'None' | 'ColorHex' | 'Image';

export interface IProductAttributeValue {
  id: number;
  productAttributeId: number;
  code: string;
  name: string;
  colorHex?: string | null;
  sortOrder: number;
  isActive: boolean;
  translations?: INameTranslation[];
}

export interface IProductAttribute {
  id: number;
  code: string;
  name: string;
  inputType: AttributeInputType;
  swatchType: AttributeSwatchType;
  isFilterable: boolean;
  displayOrder: number;
  isActive: boolean;
  values?: IProductAttributeValue[];
  translations?: INameTranslation[];
}

export class ProductAttributeParams implements IPaginationParams {
  pageNumber: number = 1;
  pageSize: number = 10;
}

export type ProductAttributePagination = PaginationWithData<IProductAttribute>;
