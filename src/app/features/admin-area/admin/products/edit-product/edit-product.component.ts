import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, catchError, firstValueFrom, of, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { IProduct } from './../../../../../shared/models/product';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject, ChangeDetectorRef } from '@angular/core';
import { IBrand } from 'src/app/shared/models/brand';
import { IProductCharacteristic, ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { ThemePalette } from '@angular/material/core';
import { ProductService } from 'src/app/core/services/product.service';
import { MatDialog } from '@angular/material/dialog';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IProductType } from 'src/app/shared/models/productType';
import { StorageService } from 'src/app/core/services/storage.service';
import { ToastrService } from 'ngx-toastr';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class EditProductComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;

  product = signal<IProduct | undefined>(undefined);
  brands  = signal<IBrand[]>([]);
  types   = signal<IProductType[]>([]);
  sizes   = signal<ISizeClassification[]>([]);

  disabledAddSizeButton = signal<boolean>(false);
  dynamicSizeAdded      = signal<boolean>(false);
  dynamicSizeRemoved    = signal<boolean>(false);

  productIdFromUrl      : number = 0;                     // 0 means new product
  productCharacteristics: IProductCharacteristic[] = [];
  validSizeList         : ISizeClassification[] = [];
  colorCheckbox         : ThemePalette;

  private backupStartTime: string | null = null;
  private backupEndTime: string | null   = null;
  private backupStartDate: string | null = null;
  private backupEndDate: string | null   = null;

  destroy$ = new Subject<void>();

  private cdRef          = inject(ChangeDetectorRef);
  private productService = inject(ProductService);
  private dialog         = inject(MatDialog);
  private activatedRoute = inject(ActivatedRoute);
  private router         = inject(Router);
  private formBuilder    = inject(FormBuilder);
  private storageService = inject(StorageService);
  private toastr         = inject(ToastrService);

  constructor() {
  }

  ngOnDestroy(): void {
    this.storageService.delete(this.getProductKey());
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.createProductForm();

      await Promise.all([
        this.loadBrands(),
        this.loadTypes(),
        this.loadSizes(),
        this.loadProduct()
      ]);

      await Promise.all([
        this.getProductFormValues(),
        this.loadArrayOfDropDownSize(),
        this.setProductInLocalStorage()
      ]);

      await this.isDiscountActiveControlShouldBeEnable();
      await this.setupDiscountValidation();

    } catch (error) {
      console.error("Fehler bei ngOnInit:", error);
    }
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.toastr.error('Please fill out the form correctly.', 'Form Validation Error');
      return;
    }

    const formValues      = this.productForm.value;
    const existingProduct = this.product();
    const isUpdate        = !!existingProduct && existingProduct.id > 0;

    // Combine date and time for discount start and end
    let discountStartDate = null;
    let discountEndDate   = null;
    if (formValues.isDiscountActive) {
      discountStartDate = this.combineDateAndTime(formValues.discountStartDateDate, formValues.discountStartDateTime);
      discountEndDate   = this.combineDateAndTime(formValues.discountEndDateDate, formValues.discountEndDateTime);
    }

    // Construct the payload
    const productPayload: Partial<IProduct> = {
      id                    : existingProduct?.id || 0,
      name                  : formValues.name,
      description           : formValues.description,
      price                 : formValues.price,
      previousPrice         : formValues.previousPrice,
      pictureUrl            : existingProduct?.pictureUrl || '',
      productType           : existingProduct?.productType,
      productTypeId         : formValues.productTypeId,
      productBrand          : existingProduct?.productBrand,
      productBrandId        : formValues.productBrandId,
      isActive              : formValues.isActive,
      isDiscountActive      : formValues.isDiscountActive,
      discountStartDate     : discountStartDate?.toISOString() || null,
      discountEndDate       : discountEndDate?.toISOString() || null,
      productCharacteristics: formValues.productCharacteristics || [],
    };

    // Determine the action: update or create
    const productAction = isUpdate
      ? this.productService.updateProduct(productPayload as IProduct)
      : this.productService.createProduct(productPayload as IProduct);

    // Execute the action and handle the response
    productAction.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedProduct) => {
        // Update the product signal with the response
        this.product.set(updatedProduct);

        // Patch the form with the updated product data, including productPhotos
        this.productForm.patchValue({
          productPhotos: updatedProduct.productPhotos,
        });
        // Mark the form as pristine
        this.productForm.markAsPristine();

        // Show success message
        const action = isUpdate ? 'updated' : 'created';
        this.toastr.success(`Product ${action} successfully`, 'Success');

        // Trigger change detection
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.toastr.error('An error occurred while saving the product.', 'Error');
        console.error('Error saving product:', err);
      },
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
      previousPrice         : [{ value: null, disabled: true }],
      productCharacteristics: this.formBuilder.array([]),
      productPhotos         : [null],
      isDiscountActive      : [{ value: false, disabled: false },Validators.required],
      discountStartDateDate : [null],                                                                    // Date part of Discount Start
      discountStartDateTime : [null],                                                                    // Time part of Discount Start
      discountEndDateDate   : [null],                                                                    // Date part of Discount End
      discountEndDateTime   : [null],                                                                    // Time part of Discount End
    });
  }

  async loadBrands(): Promise<void>  {
    this.fetchData(() => this.productService.getBrands(true), (response) => { this.brands.set([...response]); });
    return Promise.resolve();
  }

  async loadTypes(): Promise<void>  {
    this.fetchData(() => this.productService.getTypes(true), (response) => { this.types.set([...response]); });
    return Promise.resolve()
  }

  async loadSizes(): Promise<void> {
    this.fetchData(() => this.productService.getSizes(true), (response) => { this.sizes.set([...response]); });
    return Promise.resolve()
  }

  async loadProduct(): Promise<void> {
    try {
      const prod = await firstValueFrom(
        this.activatedRoute.paramMap.pipe(
          switchMap((params: ParamMap) => {
            const id = params.get('id');
            this.productIdFromUrl = (id === null ? 0 : +id);
            if (this.productIdFromUrl > 0) {
              return this.productService.getProduct(this.productIdFromUrl);
            } else {
              return of(null);
            }
          }),
          catchError((error: any) => {
            this.handleApiError(error);
            return of(null);
          }),
          takeUntil(this.destroy$)
        )
      );

      if (prod) {
        this.product.set(prod);

        this.productForm.setControl('productCharacteristics', this.formBuilder.array([]));
      }
    } catch (error) {
      console.error("Error loading product:", error);
    }
  }

  async getProductFormValues(): Promise<void> {
    if (!this.productForm) {
      console.error('productForm is not initialized');
      return;
    }

    const currentProduct = this.product();

    if (currentProduct) {
      // Extract date and time from discountStartDate and discountEndDate
      const start = this.extractDateTime(currentProduct.discountStartDate);
      const end = this.extractDateTime(currentProduct.discountEndDate);

      // Patch the form with product data
      this.productForm.patchValue({
        isActive             : currentProduct.isActive,
        name                 : currentProduct.name,
        description          : currentProduct.description,
        price                : currentProduct.price,
        productBrandId       : currentProduct.productBrandId,
        productTypeId        : currentProduct.productTypeId,
        previousPrice        : currentProduct.previousPrice,
        isDiscountActive     : currentProduct.isDiscountActive,
        productPhotos        : currentProduct.productPhotos,      // Patch productPhotos
        discountStartDateDate: start.date,
        discountStartDateTime: start.time,
        discountEndDateDate  : end.date,
        discountEndDateTime  : end.time,
      });
    }
  }

  async loadArrayOfDropDownSize(): Promise<void> {
    const chars = this.product()?.productCharacteristics;
    if (!chars) {
      return;
    }

    chars.forEach((pc) => {
      this.addDynamicDropDownSize(pc.sizeId, pc.quantity, pc.id, pc.productId);
    });
  }

  async setProductInLocalStorage(): Promise<void> {
    if (this.product()) {
      const key = `productKey_${this.activatedRoute.snapshot.paramMap.get('id')}`;
      this.storageService.set(key, JSON.stringify(this.product()));
    }
  }

  async isDiscountActiveControlShouldBeEnable(): Promise<void> {
    const prevPrice = this.product()?.previousPrice ?? 0;
    const basePrice = this.product()?.price ?? 0;
    const price = this.productForm.get("price")?.value ?? 0;

    if (price < prevPrice || price < basePrice) {
      this.productForm.get("isDiscountActive")?.enable();
      this.productForm.get("isDiscountActive")?.setValue(true);
    } else {
      this.productForm.get("isDiscountActive")?.setValue(false);
      this.productForm.get("isDiscountActive")?.disable();
    }

    // Price change subscription
    this.productForm.get("price")?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((newPrice) => {
      if (newPrice < prevPrice || newPrice < basePrice) {
        this.productForm.get("isDiscountActive")?.enable();
        this.productForm.get("isDiscountActive")?.setValue(true);
      } else {
        this.productForm.get("isDiscountActive")?.setValue(false);
        this.productForm.get("isDiscountActive")?.disable();
      }
    });
  }

  async setupDiscountValidation(): Promise<void> {
    const isDiscountActiveControl      = this.productForm.get('isDiscountActive');
    const discountStartDateDateControl = this.productForm.get('discountStartDateDate');
    const discountStartDateTimeControl = this.productForm.get('discountStartDateTime');
    const discountEndDateDateControl   = this.productForm.get('discountEndDateDate');
    const discountEndDateTimeControl   = this.productForm.get('discountEndDateTime');

    this.backupStartTime = discountStartDateTimeControl?.value;
    this.backupEndTime   = discountEndDateTimeControl?.value;
    this.backupStartDate = discountStartDateDateControl?.value;
    this.backupEndDate   = discountEndDateDateControl?.value;

    if (!isDiscountActiveControl || !discountStartDateDateControl || !discountEndDateDateControl) {
      return;
    }

    isDiscountActiveControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isActive: boolean) => {
      if (isActive) {
        const product = this.product();
        // Restore dates from product
        if (product?.discountStartDate) {
          const startDate = new Date(product.discountStartDate);
          discountStartDateDateControl.setValue(this.backupStartDate ?? formatDate(startDate, 'yyyy-MM-dd', 'en-US'));
          // Use backup time if available, otherwise use product's time
          discountStartDateTimeControl?.setValue(this.backupStartTime ?? formatDate(startDate, 'HH:mm', 'en-US'));
        } else {
          discountStartDateDateControl.setValue(null);
          discountStartDateTimeControl?.setValue(this.backupStartTime);
        }

        if (product?.discountEndDate) {
          const endDate = new Date(product.discountEndDate);
          discountEndDateDateControl.setValue(this.backupEndDate ?? formatDate(endDate, 'yyyy-MM-dd', 'en-US'));
          discountEndDateTimeControl?.setValue(this.backupEndTime ?? formatDate(endDate, 'HH:mm', 'en-US'));
        } else {
          discountEndDateDateControl.setValue(null);
          discountEndDateTimeControl?.setValue(this.backupEndTime);
        }

        // Enable controls
        discountStartDateDateControl.enable();
        discountStartDateTimeControl?.enable();
        discountEndDateDateControl.enable();
        discountEndDateTimeControl?.enable();
      } else {
        // Backup current times before clearing
        this.backupStartTime = discountStartDateTimeControl?.value;
        this.backupEndTime   = discountEndDateTimeControl?.value;
        this.backupStartDate = discountStartDateDateControl?.value;
        this.backupEndDate   = discountEndDateDateControl?.value;

        // disable controls
        discountStartDateDateControl.disable();
        discountStartDateTimeControl?.disable();
        discountEndDateDateControl.disable();
        discountEndDateTimeControl?.disable();
      }

      // Update validation
      discountStartDateDateControl.updateValueAndValidity();
      discountStartDateTimeControl?.updateValueAndValidity();
      discountEndDateDateControl.updateValueAndValidity();
      discountEndDateTimeControl?.updateValueAndValidity();
    });
  }
  // Helper method to combine date and time
  private combineDateAndTime(date: Date | null, time: Date | null): Date | null {
    if (!date || !time) return null;

    const combinedDate = new Date(date);
    combinedDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combinedDate;
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

  // Helper method to extract date and time from a string
  private extractDateTime(dateStr: string | null | undefined): { date: Date | null; time: Date | null } {
    if (!dateStr) return { date: null, time: null };

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateStr);
      return { date: null, time: null };
    }

    // Extract date part
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Extract time part
    const timeOnly = new Date(1970, 0, 1, date.getHours(), date.getMinutes());

    return { date: dateOnly, time: timeOnly };
  }

  handleApiError(error: any): void {
    console.error(error);
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

  getProductKey(): string {
    return `productKey_${this.activatedRoute.snapshot.paramMap.get('id')}`;
  }

  getFormGroup(control: AbstractControl) {
    return control as FormGroup;
  }

  removeSize(index: number) {
    this.dynamicDropDownSize.removeAt(index);
    this.disabledAddSizeButton.set(false);
    this.dynamicSizeRemoved.set(true);
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
      this.dynamicSizeAdded.set(true);
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

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
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
    return !(this.productForm.valid &&
      (this.productForm.dirty || this.dynamicSizeAdded() || this.dynamicSizeRemoved()));
  }

  private fetchData<T>(fetchDataFn: () => Observable<T>, updateFn: (data: T) => void): void {
    fetchDataFn().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        updateFn(response);
      },
      error: (error: any) => console.log(error),
    });
  }
}
