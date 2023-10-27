import { IPaginationParams, ISearchParams } from "./queryParams";

export class UserQueryParams implements IPaginationParams, ISearchParams {
  search    : string = '';
  pageNumber: number = 1;
  pageSize  : number = 5;
}
