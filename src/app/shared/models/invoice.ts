export interface IInvoiceLine {
  position          : number;
  productName       : string;
  sku?              : string;
  variantDescription?: string;
  quantity          : number;
  unitPriceGross    : number;
  lineNetAmount     : number;
  lineTaxAmount     : number;
  taxRate           : number;
  lineTotalGross    : number;
}

export interface IInvoice {
  id               : number;
  orderId          : number;
  invoiceNumber    : string;
  issueDate        : string;
  orderDate        : string;
  currency         : string;
  pricesIncludeTax : boolean;

  sellerLegalName  : string;
  sellerAddressLine: string;
  sellerVatId?     : string;
  sellerContact?   : string;

  buyerEmail       : string;
  billingFirstName : string;
  billingLastName  : string;
  billingStreet    : string;
  billingCity      : string;
  billingState?    : string;
  billingZipCode   : string;
  billingCountry?  : string;

  shippingGross    : number;
  shippingNet      : number;
  shippingTax      : number;
  shippingTaxRate  : number;
  totalNet         : number;
  totalTax         : number;
  totalGross       : number;

  taxBreakdownJson : string;
  taxNote?         : string;
  pdfUrl?          : string;

  lines            : IInvoiceLine[];
}

export interface IInvoiceSummary {
  id           : number;
  orderId      : number;
  invoiceNumber: string;
  issueDate    : string;
  buyerEmail   : string;
  currency     : string;
  totalGross   : number;
}
