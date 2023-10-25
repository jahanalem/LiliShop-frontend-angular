import { IPaginationParams } from "./queryParams";

export class UserQueryParams implements IPaginationParams {
  pageNumber: number = 1;
  pageSize  : number = 5;
}
