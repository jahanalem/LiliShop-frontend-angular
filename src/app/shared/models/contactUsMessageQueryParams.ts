import { IPaginationParams, ISearchParams, ISortParams } from "./queryParams";

export class ContactUsMessageQueryParams implements ISortParams, IPaginationParams, ISearchParams {
  sort         : string = 'id';
  sortDirection: string = 'desc';  // asc

  pageNumber: number = 1;
  pageSize  : number = 10;

  search: string = '';
}
