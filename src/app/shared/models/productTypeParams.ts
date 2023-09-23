import { IPaginationParams } from "./queryParams";

export class ProductTypeParams implements IPaginationParams {
  pageNumber: number = 1;
  pageSize: number = 5;
}
