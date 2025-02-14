import { IAdminAreaUser } from "./adminAreaUser";
import { IBrand } from "./brand";
import { IContactUsMessage } from "./contactUsMessage";
import { IPriceDropSubscription } from "./priceDropSubscription";
import { IProduct } from "./product";
import { IProductType } from "./productType";

const DEFAULT_PAGE_INDEX = 1;
const DEFAULT_PAGE_SIZE = 5;

export interface IPagination {
  pageIndex: number;
  pageSize : number;
  count    : number;
}

export interface IPaginationWithData<T> extends IPagination {
  data: T[];
}

export class PaginationWithData<T> implements IPaginationWithData<T> {
  pageIndex: number = DEFAULT_PAGE_INDEX;
  pageSize : number = DEFAULT_PAGE_SIZE;
  count    : number = 0;
  data     : T[]    = [];
}

export type ProductPagination               = PaginationWithData<IProduct>;
export type BrandPagination                 = PaginationWithData<IBrand>;
export type ProductTypePagination           = PaginationWithData<IProductType>;
export type UserPagination                  = PaginationWithData<IAdminAreaUser>;
export type ContactUsMessagePagination      = PaginationWithData<IContactUsMessage>;
export type PriceDropSubscriptionPagination = PaginationWithData<IPriceDropSubscription>;
