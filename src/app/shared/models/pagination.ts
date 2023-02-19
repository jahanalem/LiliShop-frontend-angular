import { IProduct } from "./product";

export interface IPagination {
  pageIndex: number;
  pageSize : number;
  count    : number;
  data     : IProduct[];
}

export class Pagination implements IPagination {
  pageIndex: number     = 1;
  pageSize : number     = 6;
  count    : number     = 0;
  data     : IProduct[] = [];
}
