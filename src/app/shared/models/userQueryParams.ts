import { IPaginationParams, ISearchParams, ISortParams } from "./queryParams";

export class UserQueryParams implements IPaginationParams, ISortParams, ISearchParams {
  pageNumber: number = 1;
  pageSize  : number = 5;

  sort         : string = 'id';
  sortDirection: string = 'desc'; // asc

  search: string = '';
}
