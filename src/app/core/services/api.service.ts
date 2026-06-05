import { Injectable } from '@angular/core';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }
}
