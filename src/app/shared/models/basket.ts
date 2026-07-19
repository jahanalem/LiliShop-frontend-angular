import { v4 as uuidv4 } from 'uuid';

export interface IBasket {
  id               : string;
  items            : IBasketItem[];
  clientSecret    ?: string;
  paymentIntentId ?: string;
  deliveryMethodId?: number;
  shippingPrice   ?: number;
}

export interface IBasketItem {
  /** Product id; basket lines are unique per (id, productVariantId). */
  id         : number;
  productName: string;
  price      : number;
  quantity   : number;
  pictureUrl : string;
  brand      : string;
  type       : string;
  /** The chosen variant (SKU); undefined on legacy lines — checkout resolves those server-side. */
  productVariantId  ?: number;
  /** Variant SKU shown on the basket line (e.g. "P40-BROWN-M"); undefined on legacy lines. */
  sku               ?: string;
  /** Display text like "Size: M · Color: Yellow"; the server revalidates everything else. */
  variantDescription?: string;
}

/** What the product page passes to the basket when the customer picked a concrete variant. */
export interface IBasketVariantSelection {
  id: number;
  sku: string;
  price: number;
  description: string | null;
}

export class Basket implements IBasket {
  id   : string        = uuidv4();
  items: IBasketItem[] = [];
}

export interface IBasketTotals {
  shipping: number;
  subtotal: number;
  total   : number;
}
