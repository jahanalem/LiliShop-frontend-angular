import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { IBrand } from 'src/app/shared/models/brand';
import { IProductPagination, ProductPagination } from 'src/app/shared/models/pagination';
import { IProduct } from 'src/app/shared/models/product';
import { ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { IType } from 'src/app/shared/models/productType';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseUrl: string = environment.apiUrl;
  brands: IBrand[] = [];
  types: IType[] = [];
  sizes: ISizeClassification[] = [];
  productCache: Map<any, any> = new Map();
  shopParams: ProductQueryParams = new ProductQueryParams();
  pagination: ProductPagination = new ProductPagination();

  constructor(private http: HttpClient) { }

  setShopParams(params: ProductQueryParams): void {
    this.shopParams = params;
  }

  getShopParams(): ProductQueryParams {
    return this.shopParams;
  }

  getProduct(id: number): Observable<IProduct> {
    const product = this.findProductInCache(id);

    if (product) {
      return of(product);
    }

    return this.http.get<IProduct>(this.baseUrl + 'products/' + id);
  }

  getProducts(useCache: boolean, isActive?: boolean): Observable<ProductPagination> {
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

    const paramMappings: [keyof ProductQueryParams, string][] = [
      ['brandId', 'brandId'],
      ['typeId', 'typeId'],
      ['sizeId', 'sizeId'],
      ['sort', 'sort'],
      ['search', 'search'],
      ['sortDirection', 'sortDirection'],
      ['pageNumber', 'pageIndex'],
      ['pageSize', 'pageSize']
    ];

    paramMappings.forEach(([shopParamKey, paramName]) => {
      const value = this.shopParams[shopParamKey];
      if (value !== undefined && value !== 0 && value !== '') {
        params = params.append(paramName, value.toString());
      }
    });

    return this.http.get<ProductPagination>(`${this.baseUrl}products`, { observe: 'response', params })
      .pipe(
        map(response => {
          this.productCache.set(key, response.body?.data);
          this.pagination = response.body ?? ({} as IProductPagination);
          return this.pagination;
        })
      );
  }

  updateProduct(product: IProduct): Observable<IProduct> {
    return this.http.put<IProduct>(`${this.baseUrl}products/update/${product.id}`, product);
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
