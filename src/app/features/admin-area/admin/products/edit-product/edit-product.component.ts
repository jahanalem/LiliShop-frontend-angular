import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Observable, catchError, switchMap } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { IProduct } from './../../../../../shared/models/product';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, signal } from '@angular/core';
import { IBrand } from 'src/app/shared/models/brand';
import { IProductCharacteristic, ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { ThemePalette } from '@angular/material/core';
import { ProductService } from 'src/app/core/services/product.service';
import { MatDialog } from '@angular/material/dialog';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IProductType } from 'src/app/shared/models/productType';
import { StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditProductComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;

  product               = signal<IProduct | undefined>(undefined);
  brands                = signal<IBrand[]>([]);
  types                 = signal<IProductType[]>([]);
  sizes                 = signal<ISizeClassification[]>([]);
  disabledAddSizeButton = signal<boolean>(false);

  productIdFromUrl       : number                  = 0;   // 0 means new product
  productCharacteristics: IProductCharacteristic[] = [];

  protected validSizeList: ISizeClassification[] = [];
  protected colorCheckbox: ThemePalette;

  constructor(private productService: ProductService,
    private dialog        : MatDialog,
    private activatedRoute: ActivatedRoute,
    private router        : Router,
    private formBuilder   : FormBuilder,
    private cdr           : ChangeDetectorRef,
    private storageService: StorageService) {

  }

  ngOnDestroy(): void {
    this.storageService.delete(this.getProductKey());
  }

  ngOnInit(): void {
    this.createProductForm();
    this.getBrands();
    this.getTypes();
    this.getSizes();
    this.getProduct();
    this.getProductFormValues();
    this.loadArrayOfDropDownSize();
  }

  onSubmit() {
    const formValues = this.productForm.value as IProduct;
    const existingProduct = this.product(); // Use the signal getter here

    const productPayload = {
      ...existingProduct,
      ...formValues,
      productPhotos: existingProduct?.productPhotos || formValues.productPhotos
    };

    const isUpdate = productPayload.id && productPayload.id > 0;
    // Determine the action: update or create
    const productAction = isUpdate
      ? this.productService.updateProduct(productPayload)
      : this.productService.createProduct(productPayload);

    // Execute the action and handle the response
    productAction.subscribe((updatedProduct) => {
      this.product.set(updatedProduct); // Update the signal
      this.productForm.markAsPristine();
    });
  }


  createProductForm(): void {
    this.productForm = this.formBuilder.group({
      isActive              : [false],
      name                  : [null, Validators.required],
      description           : [null, Validators.required],
      price                 : [null, [Validators.required, Validators.min(1), Validators.max(10000)]],
      productBrandId        : [null, Validators.required],
      productTypeId         : [null, Validators.required],
      productCharacteristics: this.formBuilder.array([]),
      productPhotos         : [null]
    });
  }

  get dynamicDropDownSize() {
    return this.productForm.controls['productCharacteristics'] as FormArray;
  }
  addDynamicDropDownSize(sizeId: number | string = '', qty: number = 0, id: number, productId: number) {
    const sizeForm = this.formBuilder.group({
      id       : [id],
      productId: [productId],
      sizeId   : [sizeId],
      quantity : [qty],
    });
    this.dynamicDropDownSize.push(sizeForm);
  }
  loadArrayOfDropDownSize() {
    this.product()?.productCharacteristics.forEach((_pc, _index) => {
      this.addDynamicDropDownSize(_pc.sizeId, _pc.quantity, _pc.id, _pc.productId);
    });
  }

  getProductFormValues(): void {
    if (!this.productForm) {
      console.error("productForm is not initialized");
      return;
    }
    const currentProduct = this.product();

    if (!currentProduct) {
      const storedProduct = JSON.parse(this.storageService.get(this.getProductKey()) || 'null') as IProduct;
      if (storedProduct) {
        this.product.set(storedProduct);
      }
    }

    const productToUse = this.product();
    if (productToUse) {
      this.productForm.patchValue({
        isActive      : productToUse.isActive,
        name          : productToUse.name,
        description   : productToUse.description,
        price         : productToUse.price,
        productBrandId: productToUse.productBrandId,
        productTypeId : productToUse.productTypeId
      });
    }
  }

  getProduct(): void {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        this.productIdFromUrl = (id === null ? 0 : +id);
        if (this.productIdFromUrl && +this.productIdFromUrl > 0) {
          return this.productService.getProduct(+this.productIdFromUrl);
        } else {
          return EMPTY;
        }
      }),

      catchError((error: any) => {
        this.handleApiError(error);
        return EMPTY;
      })
    ).subscribe((prod) => {
      if (prod) {

        this.product.set(prod);
        this.setProductInLocalStorage();

        this.getProductFormValues();
      }
    });
  }

  handleApiError(error: any): void {
    console.error(error);
  }

  getBrands(): void {
    this.fetchData(() => this.productService.getBrands(true), (response) => { this.brands.set([...response]); });
  }

  getTypes(): void {
    this.fetchData(() => this.productService.getTypes(true), (response) => { this.types.set([...response]); });
  }
  getSizes(): void {
    this.fetchData(() => this.productService.getSizes(true), (response) => { this.sizes.set([...response]); });
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
    const currentProduct = this.product();
    if (!currentProduct) {
      return;
    }

    const updatedProduct = {
      ...currentProduct,
      isActive: event
    };

    this.product.set(updatedProduct);
  }

  setProductInLocalStorage(): void {
    const key = `productKey_${this.activatedRoute.snapshot.paramMap.get('id')}`;
    this.storageService.set(key, JSON.stringify(this.product));
  }
  getProductKey(): string {
    return `productKey_${this.activatedRoute.snapshot.paramMap.get('id')}`;
  }

  getFormGroup(control: AbstractControl) {
    return control as FormGroup;
  }

  removeSize(index: number) {
    this.dynamicDropDownSize.removeAt(index);
    this.disabledAddSizeButton.set(false);
  }

  addSize() {
    const currentProduct = this.product();
    const effectiveProductId = currentProduct ? currentProduct.id : (this.productIdFromUrl > 0 ? this.productIdFromUrl : 0);

    if (effectiveProductId < 0) {
      return;
    }

    this.validSizeList = this.getValidSizeList();

    if (this.validSizeList.length > 0) {
      const defaultSizeId = this.validSizeList[0].id;
      this.addDynamicDropDownSize(defaultSizeId, 1, 0, effectiveProductId);
    }

    this.disabledAddSizeButton.set(this.validSizeList.length <= 1);
  }


  getAvailableSizeList(control: AbstractControl): ISizeClassification[] {
    const formGroup = control as FormGroup;
    const currentSizeId = formGroup.controls['sizeId'].value as number;
    this.validSizeList = this.getValidSizeList(currentSizeId);

    return this.validSizeList;
  }

  getValidSizeList(ignoreSizeId: number = -1): ISizeClassification[] {
    const specs: IProductCharacteristic[] = this.dynamicDropDownSize.value as IProductCharacteristic[];

    return this.sizes().filter(size => {
      return !specs.some(spec => size.id === spec.sizeId && size.id !== ignoreSizeId);
    });
  }

  navigateBack() {
    if (this.productForm.dirty) {
      const dialogData: IDialogData = {
        title: 'Discard change',
        content: 'Would you like to discard your changes?',
        showConfirmationButtons: true
      };
      const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });

      dialogRef.afterClosed().subscribe({
        next: (result?: boolean | undefined) => {
          if (result) {
            this.router.navigateByUrl('/admin/products');
          }
        },
        error: (error) => { console.error(error); }
      });
    } else {
      this.router.navigateByUrl('/admin/products');
    }
  }

  get isProductIdValid(): boolean {
    const currentProduct = this.product();
    return currentProduct ? currentProduct.id > 0 : false;
  }

  get isSaveDisabled(): boolean {
    return !this.productForm.dirty || !this.productForm.valid;
  }

  private fetchData<T>(fetchDataFn: () => Observable<T>, updateFn: (data: T) => void): void {
    fetchDataFn().subscribe({
      next: (response) => {
        updateFn(response);
        this.cdr.detectChanges();
      },
      error: (error: any) => console.log(error),
    });
  }

}
