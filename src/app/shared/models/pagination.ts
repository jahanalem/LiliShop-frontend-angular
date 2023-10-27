import { IAdminAreaUser } from "./adminAreaUser";
import { IBrand } from "./brand";
import { IProduct } from "./product";
import { IProductType } from "./productType";

export interface IPagination {
  pageIndex: number;
  pageSize : number;
  count    : number;
}

export interface IPaginationWithData<T> extends IPagination {
  data: T[];
}

export class PaginationWithData<T> implements IPaginationWithData<T> {
  pageIndex: number = 1;
  pageSize : number = 5;
  count    : number = 0;
  data     : T[]    = [];
}

export type ProductPagination     = PaginationWithData<IProduct>;
export type BrandPagination       = PaginationWithData<IBrand>;
export type ProductTypePagination = PaginationWithData<IProductType>;
export type UserPagination        = PaginationWithData<IAdminAreaUser>;
