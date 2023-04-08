
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { IBrand } from 'src/app/shared/models/brand';
import { IPagination, Pagination } from 'src/app/shared/models/pagination';
import { IProduct } from 'src/app/shared/models/product';
import { ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { IType } from 'src/app/shared/models/productType';
import { ShopParams } from 'src/app/shared/models/shopParams';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  baseUrl: string = environment.apiUrl;
  products: IProduct[] = [];
  brands: IBrand[] = [];
  types: IType[] = [];
  sizes: ISizeClassification[] = [];
  pagination: Pagination = new Pagination();
  shopParams: ShopParams = new ShopParams();
  productCache: Map<any, any> = new Map();

  constructor(private http: HttpClient) { }

  getProducts(useCache: boolean, isActive?: boolean): Observable<Pagination> {
    if (!useCache) {
      this.productCache.clear();

    }

    const key = Object.values(this.shopParams).join('-');
    if (useCache && this.productCache.has(key)) {
      this.pagination.data = this.productCache.get(key);
      return of(this.pagination);
    }

    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.append('isActive', isActive.toString());
    }

    const nonZeroParams: (keyof ShopParams)[] = ['brandId', 'typeId', 'sizeId'];
    for (const param of nonZeroParams) {
      if (this.shopParams[param] !== 0) {
        params = params.append(param, this.shopParams[param].toString());
      }
    }

    if (this.shopParams.sort) {
      params = params.append("sort", this.shopParams.sort.toString());
    }

    if (this.shopParams.search) {
      params = params.append('search', this.shopParams.search);
    }

    params = params.append('sortDirection', this.shopParams.sortDirection);
    params = params.append('pageIndex', this.shopParams.pageNumber.toString());
    params = params.append('pageSize', this.shopParams.pageSize.toString());

    return this.http.get<Pagination>(this.baseUrl + 'products', { observe: 'response', params })
      .pipe(
        map(response => {
          this.productCache.set(key, response.body?.data);
          this.pagination = response.body ?? ({} as IPagination);
          return this.pagination;
        })
      );
  }

  getProduct(id: number): Observable<IProduct> {
    const product = this.findProductInCache(id);

    if (product) {
      return of(product);
    }

    return this.http.get<IProduct>(this.baseUrl + 'products/' + id);
  }

  getBrands(isActive: boolean | null = null): Observable<IBrand[]> {
    return this.fetchData(this.brands, 'products/brands', isActive);
  }

  getTypes(isActive: boolean | null = null): Observable<IType[]> {
    return this.fetchData(this.types, 'products/types', isActive);
  }

  getSizes(isActive: boolean | null = null): Observable<ISizeClassification[]> {
    return this.fetchData(this.sizes, 'products/sizes', isActive);
  }

  setShopParams(params: ShopParams): void {
    this.shopParams = params;
  }

  getShopParams(): ShopParams {
    return this.shopParams;
  }

  updateProduct(product: IProduct): Observable<IProduct> {
    return this.http.put<IProduct>(`${this.baseUrl}products/update/${product.id}`, product);
  }

  setMainPhoto(photoId: number) {
    return this.http.put(this.baseUrl + 'products/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(`${this.baseUrl}products/delete-photo/${photoId}`);
  }

  private fetchData<T>(cache: T[], endpoint: string, isActive: boolean | null = null): Observable<T[]> {
    if (cache.length > 0) {
      return of(cache);
    }

    const params = isActive !== null ? new HttpParams().append("isActive", isActive.toString()) : new HttpParams();

    return this.http.get<T[]>(this.baseUrl + endpoint, { params }).pipe(
      tap(response => { cache = response; })
    );
  }

  private findProductInCache(id: number): IProduct | undefined {
    for (const products of this.productCache.values()) {
      const product = products.find((p: IProduct) => p.id === id);
      if (product) {
        return product;
      }
    }

    return undefined;
  }

}
