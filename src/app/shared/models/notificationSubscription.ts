export interface INotificationSubscription {
  productId?: number;
  userId   :  number;
  alertType:  'PriceDrop' | 'NewProduct' | 'Custom';
  isActive :  boolean
}
