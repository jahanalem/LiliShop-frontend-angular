import { ISizeClassification } from './../shared/models/productSize';
import { IPagination } from './../shared/models/pagination';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { IProduct } from '../shared/models/product';
import { Pagination } from '../shared/models/pagination';
import { IBrand } from '../shared/models/brand';
import { IType } from '../shared/models/productType';
import { ShopParams } from '../shared/models/shopParams';
import { map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  baseUrl = environment.apiUrl;
  products: IProduct[] = [];
  brands: IBrand[] = [];
  types: IType[] = [];
  sizes: ISizeClassification[] = [];
  pagination = new Pagination();
  shopParams = new ShopParams();
  productCache = new Map();

  constructor(private http: HttpClient) { }

  getProducts(useCache: boolean, isActive?: boolean): Observable<Pagination> {
    if (!useCache) {
      this.productCache = new Map();
    }

    if (this.productCache.size > 0 && useCache === true) {
      const key = Object.values(this.shopParams).join('-');
      if (this.productCache.has(key)) {
        this.pagination.data = this.productCache.get(key);
        return of(this.pagination);
      }
    }
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.append('isActive', isActive);
    }
    if (this.shopParams.brandId !== 0) {
      params = params.append('brandId', this.shopParams.brandId.toString());
    }
    if (this.shopParams.typeId !== 0) {
      params = params.append("typeId", this.shopParams.typeId.toString());
    }
    if (this.shopParams.sizeId !== 0) {
      params = params.append("sizeId", this.shopParams.sizeId.toString());
    }

    if (this.shopParams.search) {
      params = params.append('search', this.shopParams.search);
    }

    params = params.append('sort', this.shopParams.sort);
    params = params.append('pageIndex', this.shopParams.pageNumber.toString());
    params = params.append('pageSize', this.shopParams.pageSize.toString());

    return this.http.get<Pagination>(this.baseUrl + 'products', { observe: 'response', params })
      .pipe(
        map(response => {
          this.productCache.set(Object.values(this.shopParams).join('-'), response.body?.data);
          this.pagination = response.body ?? ({} as IPagination);
          console.log(this.pagination);
          return this.pagination;
        })
      );
  }

  getProduct(id: number): Observable<IProduct> {
    let product: IProduct | undefined;
    this.productCache.forEach((products: IProduct[]) => {
      product = products.find(p => p.id === id);
    });
    if (product) {
      return of(product);
    }

    return this.http.get<IProduct>(this.baseUrl + 'products/' + id);
  }

  getBrands(isActive: boolean | null = null): Observable<IBrand[]> {
    if (this.brands.length > 0) {
      return of(this.brands);
    }
    let params: HttpParams = new HttpParams();
    if (isActive !== null) {
      params = params.append("isActive", isActive);
    }
    return this.http.get<IBrand[]>(this.baseUrl + 'products/brands', { params: params }).pipe(
      map(response => {
        this.brands = response;
        return response;
      })
    );
  }

  getTypes(isActive: boolean | null = null): Observable<IType[]> {
    if (this.types.length > 0) {
      return of(this.types);
    }
    let params: HttpParams = new HttpParams();
    if (isActive !== null) {
      params = params.append("isActive", isActive);
    }
    return this.http.get<IType[]>(this.baseUrl + 'products/types', { params: params }).pipe(
      map(response => {
        this.types = response;
        return response;
      })
    );
  }

  getSizes(isActive: boolean | null = null): Observable<ISizeClassification[]> {
    if (this.sizes.length > 0) {
      return of(this.sizes);
    }
    let params: HttpParams = new HttpParams();
    if (isActive !== null) {
      params = params.append("isActive", isActive);
    }
    return this.http.get<ISizeClassification[]>(this.baseUrl + 'products/sizes', { params: params }).pipe(
      map(response => {
        this.sizes = response;
        return response;
      })
    );
  }

  setShopParams(params: ShopParams): void {
    this.shopParams = params;
  }

  getShopParams(): ShopParams {
    return this.shopParams;
  }

}
