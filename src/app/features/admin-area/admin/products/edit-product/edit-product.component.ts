import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, catchError, firstValueFrom, of, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject, ChangeDetectorRef } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';

import { IProduct, IProductAdmin } from './../../../../../shared/models/product';
import { IBrand } from 'src/app/shared/models/brand';
import { IProductType } from 'src/app/shared/models/productType';
import { IProductCharacteristic, ISizeClassification } from 'src/app/shared/models/productCharacteristic';
import { ISingleDiscount } from 'src/app/shared/models/discount';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';

import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { ProductService } from 'src/app/core/services/product.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { DiscountService } from 'src/app/core/services/discount.service';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class EditProductComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;

  adminProduct = signal<IProductAdmin | undefined>(undefined);
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

  private cdRef               = inject(ChangeDetectorRef);
  private dialog              = inject(MatDialog);
  private router              = inject(Router);
  private formBuilder         = inject(FormBuilder);
  private productService      = inject(ProductService);
  private activatedRoute      = inject(ActivatedRoute);
  private storageService      = inject(StorageService);
  private discountService     = inject(DiscountService);
  private notificationService = inject(NotificationService);

  constructor() {}

  ngOnDestroy(): void {
    this.storageService.delete(this.getProductKey());
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.createProductForm();
      this.setupDiscountValidation();

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

    } catch (error) {
      console.error("Error in ngOnInit:", error);
    }
  }

  get characteristics(): FormArray {
    return this.productForm.get('productCharacteristics') as FormArray;
  }

  getFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
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
      productPhotos         : [null],

      // Discount controls - No longer dependent on price!
      isDiscountActive      : [false],
      discountAmount        : [null],
      isPercentage          : [true],
      discountStartDateDate : [{ value: null, disabled: true }],
      discountStartDateTime : [{ value: null, disabled: true }],
      discountEndDateDate   : [{ value: null, disabled: true }],
      discountEndDateTime   : [{ value: null, disabled: true }],
    });
  }

  async loadBrands(): Promise<void>  {
    this.fetchData(() => this.productService.getBrands(true), (response) => { this.brands.set([...response]); });
  }

  async loadTypes(): Promise<void>  {
    this.fetchData(() => this.productService.getTypes(true), (response) => { this.types.set([...response]); });
  }

  async loadSizes(): Promise<void> {
    this.fetchData(() => this.productService.getSizes(true), (response) => { this.sizes.set([...response]); });
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
        this.adminProduct.set(prod as IProductAdmin);
        if(prod.id>0) {
          const discount = await firstValueFrom(this.discountService.getSingleDiscountForProduct(prod.id));
          this.adminProduct.update(p => ({ ...p!, discount: discount ?? null }));
          console.log("Loaded product with discount:", this.adminProduct());
        }
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

    const currentProduct = this.adminProduct();

    if (currentProduct) {
      let start = null;
      let end = null;
      let discount = null;

      if (currentProduct.discount) {
         discount = currentProduct.discount;
         start = this.extractDateTime(discount.startDate);
         end   = this.extractDateTime(discount.endDate);
      }

      // Base price logic: The admin ALWAYS edits the base price.
      const basePrice = currentProduct.previousPrice ?? currentProduct.price;

      this.productForm.patchValue({
        isActive             : currentProduct.isActive,
        name                 : currentProduct.name,
        description          : currentProduct.description,
        price                : basePrice,
        productBrandId       : currentProduct.productBrandId,
        productTypeId        : currentProduct.productTypeId,
        productPhotos        : currentProduct.productPhotos,

        isDiscountActive     : discount?.isActive ?? false,
        discountAmount       : discount?.amount ?? null,
        isPercentage         : discount?.isPercentage,

        discountStartDateDate: start?.date ?? null,
        discountStartDateTime: start?.time ?? null,
        discountEndDateDate  : end?.date ?? null,
        discountEndDateTime  : end?.time ?? null,
      });
    }
  }

  async setupDiscountValidation(): Promise<void> {
    const isDiscountActiveControl      = this.productForm.get('isDiscountActive');
    const discountStartDateDateControl = this.productForm.get('discountStartDateDate');
    const discountStartDateTimeControl = this.productForm.get('discountStartDateTime');
    const discountEndDateDateControl   = this.productForm.get('discountEndDateDate');
    const discountEndDateTimeControl   = this.productForm.get('discountEndDateTime');

    if (!isDiscountActiveControl || !discountStartDateDateControl || !discountEndDateDateControl) return;

    isDiscountActiveControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isActive: boolean) => {
      if (isActive) {

        const product = this.adminProduct();
        const discount = product?.discount;

        // --- Start Date Logic ---
        if (discount?.startDate) {
           // If the product already has a discount in the DB, restore it (or use the recent backup if the user just clicked)
           const startDate = new Date(discount.startDate);
           discountStartDateDateControl.setValue(this.backupStartDate ?? startDate);
           discountStartDateTimeControl?.setValue(this.backupStartTime ?? startDate);
        } else {
           // If it's a brand new discount, use the backup or default to 'now'
           const now = new Date();
           discountStartDateDateControl.setValue(this.backupStartDate ?? now);
           discountStartDateTimeControl?.setValue(this.backupStartTime ?? now);
        }

        // --- End Date Logic ---
        if (discount?.endDate) {
           // If the product already has an end date in the DB, restore it
           const endDate = new Date(discount.endDate);
           discountEndDateDateControl.setValue(this.backupEndDate ?? endDate);
           discountEndDateTimeControl?.setValue(this.backupEndTime ?? endDate);
        } else {
           // If it's a brand new discount, use the backup or default to 'tomorrow'
           const tomorrow = new Date();
           tomorrow.setDate(tomorrow.getDate() + 1);
           discountEndDateDateControl.setValue(this.backupEndDate ?? tomorrow);
           discountEndDateTimeControl?.setValue(this.backupEndTime ?? tomorrow);
        }

        // Enable controls so the user can edit them
        discountStartDateDateControl.enable();
        discountStartDateTimeControl?.enable();
        discountEndDateDateControl.enable();
        discountEndDateTimeControl?.enable();

      } else {
        // Backup the current values before disabling, in case the user clicked by mistake
        this.backupStartDate = discountStartDateDateControl.value;
        this.backupStartTime = discountStartDateTimeControl?.value;
        this.backupEndDate   = discountEndDateDateControl.value;
        this.backupEndTime   = discountEndDateTimeControl?.value;

        // Disable controls
        discountStartDateDateControl.disable();
        discountStartDateTimeControl?.disable();
        discountEndDateDateControl.disable();
        discountEndDateTimeControl?.disable();
      }
    });
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.notificationService.showError('Form Validation Error: Please fill out the form correctly.');
      return;
    }

    const formValues      = this.productForm.getRawValue(); // gets values even if disabled
    const existingProduct = this.adminProduct();
    const isUpdate        = !!existingProduct && existingProduct.id > 0;

    let discountPayload: Partial<ISingleDiscount> | null = null;
    const oldDiscount = this.adminProduct()?.discount;
    const forceSingleDiscount = this.shouldForceSingleDiscount(formValues);

    if (forceSingleDiscount) {
      const updatedDiscount: Partial<ISingleDiscount> = {};

      if (oldDiscount) updatedDiscount.id = oldDiscount.id;

      updatedDiscount.isActive = formValues.isDiscountActive;
      updatedDiscount.name = "Single Discount";
      updatedDiscount.isPercentage = formValues.isPercentage;
      updatedDiscount.amount = formValues.discountAmount;

      const newStart = this.combineDateAndTime(formValues.discountStartDateDate, formValues.discountStartDateTime);
      updatedDiscount.startDate = newStart?.toISOString();
      const newEnd = this.combineDateAndTime(formValues.discountEndDateDate, formValues.discountEndDateTime);
      updatedDiscount.endDate = newEnd?.toISOString();

      discountPayload = updatedDiscount;
    }

    const productPayload: IProductAdmin = {
      id                    : existingProduct?.id || 0,
      name                  : formValues.name,
      description           : formValues.description,
      price                 : formValues.price, // Admin base price
      previousPrice         : existingProduct?.previousPrice, // Preserve backend state
      pictureUrl            : existingProduct?.pictureUrl || '',
      picturePublicId       : existingProduct?.picturePublicId || '',
      productType           : existingProduct?.productType,
      productTypeId         : formValues.productTypeId,
      productBrand          : existingProduct?.productBrand,
      productBrandId        : formValues.productBrandId,
      isActive              : formValues.isActive,
      productCharacteristics: formValues.productCharacteristics || [],
      productPhotos         : existingProduct?.productPhotos || [],
      discount              : discountPayload
    };

    const productAction = isUpdate
      ? this.productService.updateProduct(productPayload)
      : this.productService.createProduct(productPayload);

    productAction.pipe(takeUntil(this.destroy$)).subscribe({
      next: (returnedProduct: IProduct) => {
        const updatedAdminProduct: IProductAdmin = {
          ...returnedProduct,
          discount: discountPayload !== null ? discountPayload : (oldDiscount ?? null)
        };

        this.adminProduct.set(updatedAdminProduct);

        this.productForm.patchValue({
          productPhotos   : returnedProduct.productPhotos,
          price           : returnedProduct.previousPrice ?? returnedProduct.price,
          isDiscountActive: updatedAdminProduct.discount?.isActive ?? false,
        });

        this.productForm.markAsPristine();
        const action = isUpdate ? 'updated' : 'created';
        this.notificationService.showSuccess(`Success: Product ${action} successfully.`);
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.notificationService.showError('Error: An error occurred while saving the product.');
        console.error('Error saving product:', err);
      },
    });
  }

  private shouldForceSingleDiscount(formValues: any): boolean {
    const productDiscount = this.adminProduct()?.discount;

    // If the admin checked the box, we send the payload.
    if (formValues.isDiscountActive) {
      return true;
    }

    // If the admin UNCHECKED the box but a discount existed previously,
    // we must send the payload so the backend knows to deactivate it.
    if (!formValues.isDiscountActive && productDiscount?.isActive) {
      return true;
    }

    return false;
  }

  private combineDateAndTime(date: any, time: any): Date | null {
    if (!date || !time) return null;

    const combinedDate = new Date(date);
    const timeObj = new Date(time);

    if (!isNaN(timeObj.getTime())) {
       combinedDate.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
    }
    return combinedDate;
  }

  private extractDateTime(dateStr: string | null | undefined): { date: Date | null; time: Date | null } {
    if (!dateStr) return { date: null, time: null };

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { date: null, time: null };

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const timeOnly = new Date(1970, 0, 1, date.getHours(), date.getMinutes());

    return { date: dateOnly, time: timeOnly };
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

  async loadArrayOfDropDownSize(): Promise<void> {
    const chars = this.adminProduct()?.productCharacteristics;
    if (!chars) return;

    chars.forEach((pc) => {
      this.addDynamicDropDownSize(pc.sizeId, pc.quantity, pc.id, pc.productId);
    });
  }

  async setProductInLocalStorage(): Promise<void> {
    if (this.adminProduct()) {
      const key = this.getProductKey();
      this.storageService.set(key, JSON.stringify(this.adminProduct()));
    }
  }

  getProductKey(): string {
    return `productKey_${this.activatedRoute.snapshot.paramMap.get('id')}`;
  }

  handleApiError(error: any): void {
    console.error(error);
  }

  onIsActiveChange(event: boolean): void {
    const currentProduct = this.adminProduct();
    if (!currentProduct) return;
    this.adminProduct.set({ ...currentProduct, isActive: event });
  }

  removeSize(index: number) {
    this.dynamicDropDownSize.removeAt(index);
    this.disabledAddSizeButton.set(false);
    this.dynamicSizeRemoved.set(true);
  }

  addSize() {
    const currentProduct = this.adminProduct();
    const effectiveProductId = currentProduct ? currentProduct.id : (this.productIdFromUrl > 0 ? this.productIdFromUrl : 0);

    if (effectiveProductId < 0) return;

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
        next: (result?: boolean) => {
          if (result) this.router.navigateByUrl('/admin/products');
        },
        error: (error) => { console.error(error); }
      });
    } else {
      this.router.navigateByUrl('/admin/products');
    }
  }

  get isProductIdValid(): boolean {
    const currentProduct = this.adminProduct();
    return currentProduct ? currentProduct.id > 0 : false;
  }

  get isSaveDisabled(): boolean {
    return !(this.productForm.valid &&
      (this.productForm.dirty || this.dynamicSizeAdded() || this.dynamicSizeRemoved()));
  }

  isDiscountGroup(): boolean{
    const discountGroupId = this.adminProduct()?.discount?.discountGroupId;
    return !!(discountGroupId && discountGroupId > 0);
  }

  private fetchData<T>(fetchDataFn: () => Observable<T>, updateFn: (data: T) => void): void {
    fetchDataFn().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => updateFn(response),
      error: (error: any) => console.log(error),
    });
  }
}
