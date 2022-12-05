import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of, switchMap } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { IProduct } from './../../../../../shared/models/product';
import { ShopService } from './../../../../../core/services/shop.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IBrand } from 'src/app/shared/models/brand';
import { IType } from 'src/app/shared/models/productType';
import { IProductCharacteristic, ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { ThemePalette } from '@angular/material/core';
import { formHelper } from 'src/app/core/helpers/form-helper';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss']
})
export class EditProductComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  product: IProduct | null = null;
  brands: IBrand[] = [];
  types: IType[] = [];
  sizes: ISizeClassification[] = [];
  productCharacteristics: IProductCharacteristic[] = [];
  protected colorCheckbox: ThemePalette;

  constructor(private shopService: ShopService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder) {

  }

  ngOnDestroy(): void {
    localStorage.removeItem(this.getProductKeyFromLocalStorage());
  }

  ngOnInit(): void {
    this.getBrands();
    this.getTypes();
    this.getSizes();
    this.getProduct();
    this.createProductForm();
    this.getProductFormValues();
    this.loadArrayOfDropDownSize();
  }

  onSubmit() {
    const changedValues = formHelper.getChangedValues<IProduct>(this.productForm);
    const updatedProduct = { ...this.product, ...changedValues }
    console.log(updatedProduct);
    this.shopService.updateProduct(updatedProduct).subscribe((p) => {
      console.log(p);
    });
  }

  createProductForm(): void {
    this.productForm = this.formBuilder.group({
      isActive: [false],
      name: [null, Validators.required],
      description: [null, Validators.required],
      productBrandId: [null, Validators.required],
      productTypeId: [null, Validators.required],
      dynamicDropDownSize: this.formBuilder.array([]),
    });
  }

  get dynamicDropDownSize() {
    return this.productForm.controls['dynamicDropDownSize'] as FormArray;
  }
  addDynamicDropDownSize(sizeId: number | string = '', qty: number = 0) {
    const sizeForm = this.formBuilder.group({
      size: [sizeId],
      quantity: [qty]
    });
    this.dynamicDropDownSize.push(sizeForm);
  }
  loadArrayOfDropDownSize() {
    this.product?.productCharacteristics.forEach((_pc, _index) => {
      this.addDynamicDropDownSize(_pc.sizeId, _pc.quantity);
    });
  }

  getProductFormValues(): void {
    // if we refresh the page, we dont'n access to the product object and then we cannot get id from it.
    // Therefore we need to get id from activatedRoute.
    if (!this.product) {
      const product = localStorage.getItem(this.getProductKeyFromLocalStorage());
      if (product) {
        this.product = JSON.parse(product) as IProduct;
      }
    }
    this.productForm?.patchValue({
      isActive: this.product?.isActive,
      name: this.product?.name,
      description: this.product?.description,
      productBrandId: this.product?.productBrandId,
      productTypeId: this.product?.productTypeId
    });
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
        this.setProductInLocalStorage();
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
  onIsActiveChange(event: boolean): void {
    if (!this.product) {
      return;
    }
    this.product.isActive = event;
  }

  setProductInLocalStorage(): void {
    const key = `productKey_${this.activatedRoute.snapshot.paramMap.get('id')}`;
    localStorage.setItem(key, JSON.stringify(this.product));
  }
  getProductKeyFromLocalStorage(): string {
    return `productKey_${this.activatedRoute.snapshot.paramMap.get('id')}`;
  }

  getFormGroup(control: AbstractControl) {
    return control as FormGroup;
  }
}
