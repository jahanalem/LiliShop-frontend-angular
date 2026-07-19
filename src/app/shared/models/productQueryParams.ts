import { IPaginationParams, ISearchParams, ISortParams } from "./queryParams";

export class ProductQueryParams implements ISortParams, IPaginationParams, ISearchParams {
  brandId      : number = 0;
  typeId       : number = 0;

  sort         : string = 'id';
  sortDirection: string = 'desc'; // asc

  pageNumber   : number = 1;
  pageSize     : number = 10;

  search       : string = '';
  sale         : string = 'all';

  /**
   * Attribute facets: one entry per attribute holding the selected value ids
   * (["201,202", "101"] → yellow-or-black AND size-M, satisfied by the same variant).
   */
  attrValues   : string[] = [];
}
