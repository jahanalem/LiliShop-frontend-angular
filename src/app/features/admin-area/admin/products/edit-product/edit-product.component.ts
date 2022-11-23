import { of, switchMap } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { IProduct } from './../../../../../shared/models/product';
import { ShopService } from './../../../../../core/services/shop.service';
import { Component, AfterViewInit, OnInit } from '@angular/core';
import { IBrand } from 'src/app/shared/models/brand';
import { IType } from 'src/app/shared/models/productType';
import { ISizeClassification } from 'src/app/shared/models/productSize';
import { ThemePalette } from '@angular/material/core';

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
  protected colorCheckbox: ThemePalette;
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
    ).subscribe({
      next: (prod) => {
        this.product = prod;
        this.product.productBrandId = this.brands.find(b => b.name === prod.productBrand)?.id;
        this.product.productTypeId = this.types.find(t => t.name === prod.productType)?.id;
      },
      error: (error: any) => { console.log(error); }
    });
  }
  getBrands(): void {
    this.shopService.getBrands(true).subscribe({
      next: (response) => { this.brands = [...response]; },
      error: (error: any) => { console.log(error); }
    });
  }
  getTypes(): void {
    this.shopService.getTypes(true).subscribe({
      next: (response) => { this.types = [...response]; },
      error: (error: any) => { console.log(error); }
    })
  }
  getSizes(): void {
    this.shopService.getSizes(true).subscribe({
      next: (response) => { this.sizes = [...response]; },
      error: (error: any) => { console.log(error); }
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
  onIsActiveChange(event: boolean) {
    if (!this.product) {
      return;
    }
    this.product.isActive = event;
  }
}
