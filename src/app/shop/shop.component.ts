import { ShopService } from './shop.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IProduct } from '../shared/models/product';
import { IBrand } from '../shared/models/brand';
import { IType } from '../shared/models/productType';
import { ShopParams } from '../shared/models/shopParams';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
  // { static: true } needs to be set when you want to access the ViewChild in ngOnInit.
  // { static: false } can only be accessed in ngAfterViewInit. This is also what you want to go for when you have a structural directive (i.e. *ngIf) on your element in your template.
  @ViewChild('search', { static: true }) searchTerm!: ElementRef;
  products: IProduct[] = [];
  brands: IBrand[] = [];
  types: IType[] = [];
  shopParams: ShopParams = new ShopParams();
  totalCount: number = 0;
  sortOptions = [
    { name: 'Alphabetical', value: 'name' },
    { name: 'Price: Low to high', value: 'priceAsc' },
    { name: 'Price: High to low', value: 'priceDesc' },
  ]

  constructor(private shopService: ShopService) {
    this.shopParams = this.shopService.getShopParams();
  }

  ngOnInit(): void {
    this.getProducts();
    this.getBrands();
    this.getTypes();
  }

  getProducts() {
    this.shopService.getProducts().subscribe(response => {
      if (response) {
        this.products = response.data;
        this.totalCount = response.count;
      }
    }, error => {
      console.log(error);
    });
  }

  getBrands() {
    this.shopService.getBrands().subscribe(response => {
      this.brands = [{ id: 0, name: 'All' }, ...response];
    }, error => {
      console.log(error);
    })
  }

  getTypes() {
    this.shopService.getTypes().subscribe(response => {
      this.types = [{ id: 0, name: 'All' }, ...response];
    }, error => {
      console.log(error);
    })
  }

  onBrandSelected(eventTarget: EventTarget) {
    const brandId = +(eventTarget as HTMLInputElement).value;
    const params = this.shopService.getShopParams();
    params.brandId = brandId;
    params.pageNumber = 1;
    this.shopService.setShopParams(params);
    this.getProducts();
  }

  onTypeSelected(eventTarget: EventTarget) {
    const typeId = +(eventTarget as HTMLInputElement).value;
    const params = this.shopService.getShopParams();
    params.typeId = typeId;
    params.pageNumber = 1;
    this.shopService.setShopParams(params);
    this.getProducts();
  }

  onSortSelected(eventTarget: EventTarget) {
    const sort = (eventTarget as HTMLInputElement).value;
    const params = this.shopService.getShopParams();
    console.log(sort);
    params.sort = sort;
    this.shopService.setShopParams(params);
    this.getProducts();
  }

  onPageChanged(event: number) {
    if (this.shopParams.pageNumber !== event) {
      this.shopParams.pageNumber = event;
      this.getProducts();
    }
  }

  onSearch() {
    const params = this.shopService.getShopParams();
    params.search = this.searchTerm.nativeElement.value;
    params.pageNumber = 1;
    this.shopService.setShopParams(params);
    this.getProducts();
  }

  onReset() {
    this.searchTerm.nativeElement.value = '';
    this.shopParams = new ShopParams();
    this.shopService.setShopParams(this.shopParams);
    this.getProducts();
  }
}
