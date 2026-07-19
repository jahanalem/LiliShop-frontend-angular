import { IProductAttribute, IProductAttributeValue } from './productAttribute';

export interface IVariantAttributeValueLink {
  id: number;
  productVariantId: number;
  productAttributeId: number;
  productAttributeValueId: number;
  isDefining: boolean;
  productAttribute?: IProductAttribute;
  productAttributeValue?: IProductAttributeValue;
}

export interface IVariantInventory {
  id: number;
  productVariantId: number;
  quantityOnHand: number;
  quantityReserved: number;
}

/** A sellable unit (SKU) of a product, as returned by the API. */
export interface IProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number;
  previousPrice?: number | null;
  axisSignature: string;
  barcode?: string | null;
  weightGrams?: number | null;
  isActive: boolean;
  position: number;
  attributeValues: IVariantAttributeValueLink[];
  inventory?: IVariantInventory | null;
}

export interface IVariantAttributeSelection {
  attributeId: number;
  valueId: number;
}

/** One defining axis and the values to expand for it during bulk generation. */
export interface IVariantAxisSelection {
  attributeId: number;
  valueIds: number[];
}

/** Request body for POST productvariants/product/{id}/generate. */
export interface IVariantGenerationRequest {
  axes: IVariantAxisSelection[];
  descriptive?: IVariantAttributeSelection[];
  /** e.g. "SHIRT-{PATTERN}-{SIZE}"; null/blank → SKUs auto-generated on save. */
  skuPattern?: string | null;
}

/** One row of the admin batch-upsert payload (PUT productvariants/product/{id}). */
export interface IVariantUpsertRow {
  id: number;
  /** null/empty → the backend auto-generates from product id + defining value codes. */
  sku: string | null;
  price: number;
  previousPrice?: number | null;
  barcode?: string | null;
  weightGrams?: number | null;
  isActive: boolean;
  position: number;
  quantityOnHand: number;
  axisValues: IVariantAttributeSelection[];
  descriptiveValues?: IVariantAttributeSelection[];
}
