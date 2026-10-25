import { IAddress } from './address';
export interface CheckoutInput {
  basketId: string;
  deliveryMethodId: number;
  shipToAddress: IAddress;
  lines: {productId: number; productVariantId?: number; quantity: number}[];
}
export interface CheckoutView {
  id: string; attemptId: string; state: 'Preparing'|'Ready'|'Verifying'|'PaymentVerified'|'ReviewRequired'|'Expired'|'Cancelled';
  orderId: number|null; expiresAt: string; subtotal: number; shipping: number; total: number; currency: string;
  reviewReason: string|null;
}
export interface CheckoutConfirmation { checkout: CheckoutView; clientSecret: string|null; }

export interface CheckoutPaymentConfiguration { publishableKey: string; }
