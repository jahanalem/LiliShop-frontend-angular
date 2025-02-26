import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { IBrand } from 'src/app/shared/models/brand';
import { PaginationWithData, ProductPagination } from 'src/app/shared/models/pagination';
import { IProduct } from 'src/app/shared/models/product';
import { ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { ProductQueryParams } from 'src/app/shared/models/productQueryParams';
import { IProductType } from 'src/app/shared/models/productType';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseUrl: string = environment.apiUrl;

  brands: IBrand[]              = [];
  types : IProductType[]        = [];
  sizes : ISizeClassification[] = [];

  productCache: Map<any, any> = new Map();

  shopParams: ProductQueryParams           = new ProductQueryParams();
  pagination: PaginationWithData<IProduct> = new PaginationWithData<IProduct>();

  constructor(private http: HttpClient) { }

  setShopParams(params: ProductQueryParams): void {
    this.shopParams = params;
  }

  getShopParams(): ProductQueryParams {
    return this.shopParams;
  }

  getProduct(productId: number): Observable<IProduct> {
    return this.http.get<IProduct>(`${this.baseUrl}products/${productId}`);
  }

  getProducts(isActive?: boolean): Observable<ProductPagination> {
    const useCache = environment.useCache;

    const CACHE_DURATION = 1*60*1000; // 1 minutes in milliseconds

    if (!useCache) {
      this.productCache.clear();
    }

    const key = this.generateCacheKey();;

    if (useCache && this.productCache.has(key)) {
      const cachedData = this.productCache.get(key);

      if(cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
        this.pagination = {
          data     : cachedData.results.data,
          count    : cachedData.results.count,
          pageIndex: cachedData.results.pageIndex,
          pageSize : cachedData.results.pageSize
        };
        console.log("Data retrieved from cache!");
        return of(this.pagination);
      }
      else{
        this.productCache.delete(key);
        console.log("Cache expired, fetching new data.");
      }
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
          const results = response.body;
          this.productCache.set(key, { results, timestamp: Date.now() });
          console.log("Data stored in cache!");
          this.pagination = results ?? ({} as ProductPagination);
          return this.pagination;
        })
      );
  }

  updateProduct(product: IProduct): Observable<IProduct> {
    return this.http.put<IProduct>(`${this.baseUrl}products/update/${product.id}`, product);
  }

  createProduct(product: IProduct): Observable<IProduct> {
    return this.http.post<IProduct>(`${this.baseUrl}products/create/`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}products/delete/${id}`)
      .pipe(catchError(error => {
        console.error(error);
        return throwError(() => error);
      }));
  }

  getBrands(isActive: boolean | null = null): Observable<IBrand[]> {
    return this.fetchData(this.brands, 'products/brands', isActive);
  }

  getTypes(isActive: boolean | null = null): Observable<IProductType[]> {
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

  clearProductCache(): void {
    this.productCache.clear();
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
  private generateCacheKey(): string {
    return Object.values(this.shopParams).join('-');
  }

  // private findProductInCache(id: number): IProduct | undefined {
  //   for (const products of this.productCache.values()) {
  //     const product = products.find((p: IProduct) => p.id === id);
  //     if (product) {
  //       return product;
  //     }
  //   }

  //   return undefined;
  // }
}
