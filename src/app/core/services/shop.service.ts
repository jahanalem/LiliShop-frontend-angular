
import { Injectable } from '@angular/core';
import { ShopParams } from 'src/app/shared/models/shopParams';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  shopParams: ShopParams = new ShopParams();

  constructor() { }

  setShopParams(params: ShopParams): void {
    this.shopParams = params;
  }

  getShopParams(): ShopParams {
    return this.shopParams;
  }
}
