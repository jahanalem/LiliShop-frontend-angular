import { IPaginationParams, ISearchParams, ISortParams } from "./queryParams";

export class DiscountParams implements IPaginationParams, ISortParams, ISearchParams {
  search       : string | null = '';
  sort         : string        = 'id';
  sortDirection: string        = 'desc';
  pageNumber   : number        = 1;
  pageSize     : number        = 20;
}
