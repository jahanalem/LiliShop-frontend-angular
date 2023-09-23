import { IBrand } from "./brand";
import { IProduct } from "./product";
import { IProductType } from "./productType";

export interface IPagination {
  pageIndex: number;
  pageSize : number;
  count    : number;
}

export interface IProductPagination extends IPagination {
  data: IProduct[];
}
export class ProductPagination implements IProductPagination {
  pageIndex: number     = 1;
  pageSize : number     = 5;
  count    : number     = 0;
  data     : IProduct[] = [];
}



export interface IBrandPagination extends IPagination {
  data: IBrand[];
}
export class BrandPagination implements IBrandPagination {
  pageIndex: number   = 1;
  pageSize : number   = 5;
  count    : number   = 0;
  data     : IBrand[] = [];
}

export interface IProductTypePagination extends IPagination {
  data: IProductType[];
}
export class ProductTypePagination implements IProductTypePagination {
  pageIndex: number          = 1;
  pageSize  : number         = 5;
  count     : number         = 0;
  data      : IProductType[] = [];
}
