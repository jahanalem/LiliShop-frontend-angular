import { of, switchMap } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { IProduct } from './../../../../../shared/models/product';
import { ShopService } from './../../../../../core/services/shop.service';
import { Component, AfterViewInit, OnInit } from '@angular/core';
import { IBrand } from 'src/app/shared/models/brand';
import { IType } from 'src/app/shared/models/productType';
import { ISizeClassification } from 'src/app/shared/models/productSize';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss']
})
export class EditProductComponent implements AfterViewInit, OnInit {
  product: IProduct | null = null;
  brands: IBrand[] = [];
  types: IType[] = [];
  sizes: ISizeClassification[] = [];
  constructor(private shopService: ShopService, private activatedRoute: ActivatedRoute) {

  }
  ngOnInit(): void {
    this.getBrands();
    this.getTypes();
    //this.getSizes();
    this.getProduct();
  }
  ngAfterViewInit(): void {

  }


  getProduct() {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        return id ? this.shopService.getProduct(+id) : of();
      })
    ).subscribe(prod => {
      this.product = prod;
      this.product.productBrandId = this.brands.find(b => b.name === prod.productBrand)?.id;
      this.product.productTypeId = this.types.find(t => t.name === prod.productType)?.id;
    }, error => {
      console.log(error);
    });
  }
  getBrands(): void {
    this.shopService.getBrands(true).subscribe(response => {
      this.brands = [{ id: 0, name: 'All' }, ...response];
    }, error => {
      console.log(error);
    })
  }
  getTypes(): void {
    this.shopService.getTypes(true).subscribe(response => {
      this.types = [{ id: 0, name: 'All' }, ...response];
    }, error => {
      console.log(error);
    })
  }
  getSizes(): void {
    this.shopService.getSizes(true).subscribe(response => {
      this.sizes = [{ id: 0, size: 'All', isActive: false }, ...response];
    }, error => {
      console.log(error);
    })
  }


  onSizeSelected(eventTarget: EventTarget): void {
    const sizeId = +(eventTarget as HTMLInputElement).value;
    console.log(sizeId);
  }
  onBrandSelected(eventTarget: EventTarget): void {
    const brandId = +(eventTarget as HTMLInputElement).value;
    console.log(brandId);
  }
  onTypeSelected(eventTarget: EventTarget): void {
    const typeId = +(eventTarget as HTMLInputElement).value;
    console.log(typeId);
  }

}
