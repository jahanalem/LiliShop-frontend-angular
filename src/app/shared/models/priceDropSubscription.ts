export interface IPriceDropSubscription {
  userId          : number;
  displayName     : string;
  email           : string;
  productId       : number;
  productName     : string;
  productPrice    : number;
  subscriptionDate: Date;
  oldPrice        : number | null;
}
