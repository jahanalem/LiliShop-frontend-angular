import { IPaginationParams } from "./queryParams";

export class BrandParams implements IPaginationParams {
  pageNumber: number = 1;
  pageSize  : number = 5;
}
