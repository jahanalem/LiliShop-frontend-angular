import { IPaginationParams, ISearchParams, ISortParams } from "./queryParams";

export class ProductQueryParams implements ISortParams, IPaginationParams, ISearchParams {
  brandId      : number = 0;
  typeId       : number = 0;
  sizeId       : number = 0;

  sort         : string = 'name';
  sortDirection: string = 'asc';

  pageNumber   : number = 1;
  pageSize     : number = 5;

  search       : string = '';
}
