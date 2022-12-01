import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of, switchMap } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { IProduct } from './../../../../../shared/models/product';
import { ShopService } from './../../../../../core/services/shop.service';
import { Component, AfterViewInit, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IBrand } from 'src/app/shared/models/brand';
import { IType } from 'src/app/shared/models/productType';
import { IProductCharacteristic, ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss']
})
export class EditProductComponent implements AfterViewInit, OnInit, OnChanges {
  productForm!: FormGroup;
  product: IProduct | null = null;
  brands: IBrand[] = [];
  types: IType[] = [];
  sizes: ISizeClassification[] = [];
  productCharacteristics: IProductCharacteristic[] = [];
  protected colorCheckbox: ThemePalette;
  localStorageProductKey: string = "productKey_";
  constructor(private shopService: ShopService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder) {

  }
  ngOnChanges(_changes: SimpleChanges): void {
    this.getProduct();
    this.getProductFormValues();
  }
  ngOnInit(): void {
    this.getBrands();
    this.getTypes();
    this.getSizes();
    this.getProduct();
    this.createProductForm();
    this.getProductFormValues();
  }
  ngAfterViewInit(): void {

  }

  onSubmit() {

  }

  createProductForm(): void {
    this.productForm = this.formBuilder.group({
      isActive: [false],
      name: [null, Validators.required],
      description: [null, Validators.required],
      productBrandId: [null, Validators.required],
      productTypeId: [null, Validators.required],
    });
  }

  getProductFormValues(): void {
    // if we refresh the page, we dont'n access to the product object and then we cannot get id from it.
    // Therefore we need to get id from activatedRoute.
    if (!this.product) {
      const id = this.activatedRoute.snapshot.paramMap.get('id')
      this.localStorageProductKey = `productKey_${id}`;
      const product = localStorage.getItem(this.localStorageProductKey);
      if (product !== null)
        this.product = JSON.parse(product) as IProduct;
    }
    this.productForm?.patchValue({
      isActive: this.product?.isActive,
      name: this.product?.name,
      description: this.product?.description,
      productBrandId: this.product?.productBrandId,
      productTypeId: this.product?.productTypeId
    }, { emitEvent: false });
  }

  getProduct(): void {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        return id ? this.shopService.getProduct(+id) : of();
      })
    ).subscribe({
      next: (prod) => {
        this.product = prod;
        this.localStorageProductKey = `productKey_${this.product?.id}`;
        localStorage.setItem(this.localStorageProductKey, JSON.stringify(this.product));
        this.getProductFormValues();
      },
      error: (error: any) => { console.log(error); },
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
    });
  }
  getSizes(): void {
    this.shopService.getSizes(true).subscribe({
      next: (response) => { this.sizes = [...response]; },
      error: (error: any) => { console.log(error); }
    });
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
