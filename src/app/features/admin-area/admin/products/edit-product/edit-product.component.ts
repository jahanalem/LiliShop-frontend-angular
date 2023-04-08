import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Observable, switchMap } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { IProduct } from './../../../../../shared/models/product';
import { ShopService } from './../../../../../core/services/shop.service';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterContentChecked, ChangeDetectionStrategy } from '@angular/core';
import { IBrand } from 'src/app/shared/models/brand';
import { IType } from 'src/app/shared/models/productType';
import { IProductCharacteristic, ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditProductComponent implements OnInit, OnDestroy, AfterContentChecked {
  productForm!: FormGroup;
  product: IProduct | undefined;
  brands: IBrand[] = [];
  types: IType[] = [];
  sizes: ISizeClassification[] = [];
  protected validSizeList: ISizeClassification[] = [];
  protected disabledAddSizeButton: boolean = false;
  productCharacteristics: IProductCharacteristic[] = [];
  protected colorCheckbox: ThemePalette;

  constructor(private shopService: ShopService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef) {

  }
  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
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
    const formValues = this.productForm.value as IProduct;

    const updatedProduct = { ...this.product, ...formValues }

    delete updatedProduct['productType'];
    delete updatedProduct['productBrand'];

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
      productCharacteristics: this.formBuilder.array([]),
      productPhotos: [null]
    });
  }

  get dynamicDropDownSize() {
    return this.productForm.controls['productCharacteristics'] as FormArray;
  }
  addDynamicDropDownSize(sizeId: number | string = '', qty: number = 0, id: number, productId: number) {
    const sizeForm = this.formBuilder.group({
      id: [id],
      productId: [productId],
      sizeId: [sizeId],
      quantity: [qty],
    });
    this.dynamicDropDownSize.push(sizeForm);
  }
  loadArrayOfDropDownSize() {
    this.product?.productCharacteristics.forEach((_pc, _index) => {
      this.addDynamicDropDownSize(_pc.sizeId, _pc.quantity, _pc.id, _pc.productId);
    });
  }

  getProductFormValues(): void {
    // if we refresh the page, we dont'n access to the product object and then we cannot get id from it.
    // Therefore we need to get id from activatedRoute.

    this.product ??= JSON.parse(localStorage.getItem(this.getProductKeyFromLocalStorage()) || 'null') as IProduct;

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
        return id ? this.shopService.getProduct(+id) : EMPTY;
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
    this.fetchData(() => this.shopService.getBrands(true), (response) => { this.brands = [...response]; });
  }

  getTypes(): void {
    this.fetchData(() => this.shopService.getTypes(true), (response) => { this.types = [...response]; });
  }
  getSizes(): void {
    this.fetchData(() => this.shopService.getSizes(true), (response) => { this.sizes = [...response]; });
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

  removeSize(index: number) {
    this.dynamicDropDownSize.removeAt(index);
    this.disabledAddSizeButton = false;
  }

  addSize() {
    if (this.product) {
      this.validSizeList = this.getValidSizeList();

      if (this.validSizeList.length > 0) {
        const defaultSizeId = this.validSizeList[0].id;
        this.addDynamicDropDownSize(defaultSizeId, 1, 0, this.product?.id);
      }

      this.disabledAddSizeButton = this.validSizeList.length <= 1;
    }
  }

  getAvailableSizeList(control: AbstractControl): ISizeClassification[] {
    const formGroup = control as FormGroup;
    const currentSizeId = formGroup.controls['sizeId'].value as number;
    this.validSizeList = this.getValidSizeList(currentSizeId);

    return this.validSizeList;
  }

  getValidSizeList(ignoreSizeId: number = -1): ISizeClassification[] {
    const specs: IProductCharacteristic[] = this.dynamicDropDownSize.value as IProductCharacteristic[];

    return this.sizes.filter(size => {
      return !specs.some(spec => size.id === spec.sizeId && size.id !== ignoreSizeId);
    });
  }

  private fetchData<T>(fetchDataFn: () => Observable<T>, updateFn: (data: T) => void): void {
    fetchDataFn().subscribe({
      next: (response) => updateFn(response),
      error: (error: any) => console.log(error),
    });
  }

}
