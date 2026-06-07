import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject, ChangeDetectorRef, effect } from '@angular/core';
import { form, required, min, max, FormField } from '@angular/forms/signals';
import { Observable, Subject, catchError, firstValueFrom, of, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MatNativeDateModule, ThemePalette } from '@angular/material/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonModule } from '@angular/common';

interface ProductFormModel {
  isActive: boolean;
  name: string;
  description: string;
  price: number;
  productBrandId: number | null;
  productTypeId: number | null;
  productCharacteristics: {
    id: number;
    productId: number;
    sizeId: number;
    quantity: number;
  }[];
  isDiscountActive: boolean;
  discountAmount: number | null;
  isPercentage: boolean;
  discountStartDateDate: Date | null;
  discountStartDateTime: Date | null;
  discountEndDateDate: Date | null;
  discountEndDateTime: Date | null;
}

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule,
    SharedModule,
  ]
})
export class EditProductComponent implements OnInit, OnDestroy {

  productModel = signal<ProductFormModel>({
    isActive: false,
    name: '',
    description: '',
    price: 0,
    productBrandId: null,
    productTypeId: null,
    productCharacteristics: [],
    isDiscountActive: false,
    discountAmount: null,
    isPercentage: true,
    discountStartDateDate: null,
    discountStartDateTime: null,
    discountEndDateDate: null,
    discountEndDateTime: null,
  });

  productForm = form(this.productModel, (p) => {
    required(p.name);
    required(p.description);
    required(p.price);
    min(p.price, 1);
    max(p.price, 10000);
    required(p.productBrandId);
    required(p.productTypeId);
  });

  adminProduct = signal<IProductAdmin | undefined>(undefined);
  brands  = signal<IBrand[]>([]);
  types   = signal<IProductType[]>([]);
  sizes   = signal<ISizeClassification[]>([]);

  disabledAddSizeButton = signal<boolean>(false);
  dynamicSizeAdded      = signal<boolean>(false);
  dynamicSizeRemoved    = signal<boolean>(false);
  isFormDirty           = signal<boolean>(false);

  productIdFromUrl      : number = 0;
  productCharacteristics: IProductCharacteristic[] = [];
  validSizeList         : ISizeClassification[] = [];
  colorCheckbox         : ThemePalette;

  private backupStartTime: Date | null = null;
  private backupEndTime  : Date | null = null;
  private backupStartDate: Date | null = null;
  private backupEndDate  : Date | null = null;

  private isInitialLoad = true;

  destroy$ = new Subject<void>();

  private cdRef               = inject(ChangeDetectorRef);
  private dialog              = inject(MatDialog);
  private router              = inject(Router);
  private productService      = inject(ProductService);
  private activatedRoute      = inject(ActivatedRoute);
  private storageService      = inject(StorageService);
  private discountService     = inject(DiscountService);
  private notificationService = inject(NotificationService);

  constructor() {
    effect(() => {
      this.productModel();

      if (this.isInitialLoad) {
        this.isInitialLoad = false;
      } else {
        this.isFormDirty.set(true);
      }
    });
  }

  get isFormValid(): boolean {
    const values = this.productModel();
    return !!(
      values.name?.trim() &&
      values.description?.trim() &&
      values.price >= 1 &&
      values.price <= 10000 &&
      values.productBrandId !== null &&
      values.productTypeId !== null
    );
  }

  ngOnDestroy(): void {
    this.storageService.delete(this.getProductKey());
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    try {
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
        const adminProd: IProductAdmin = prod as IProductAdmin;
        if(prod.id > 0) {
          const discount = await firstValueFrom(this.discountService.getSingleDiscountForProduct(prod.id));
          adminProd.discount = discount ?? null;
        }
        this.adminProduct.set(adminProd);
        this.productModel.update(m => ({ ...m, productCharacteristics: [] }));
      }
    } catch (error) {
      console.error("Error loading product:", error);
    }
  }

  async getProductFormValues(): Promise<void> {
    const currentProduct = this.adminProduct();
    if (currentProduct) {
      this.isInitialLoad = true;
      let start = null;
      let end = null;
      let discount = null;

      if (currentProduct.discount) {
         discount = currentProduct.discount;
         start = this.extractDateTime(discount.startDate);
         end   = this.extractDateTime(discount.endDate);
      }

      const basePrice = currentProduct.previousPrice ?? currentProduct.price;

      this.productForm.isActive().value.set(currentProduct.isActive);
      this.productForm.name().value.set(currentProduct.name);
      this.productForm.description().value.set(currentProduct.description);
      this.productForm.price().value.set(basePrice);
      this.productForm.productBrandId().value.set(currentProduct.productBrandId);
      this.productForm.productTypeId().value.set(currentProduct.productTypeId);

      this.productForm.isDiscountActive().value.set(discount?.isActive ?? false);
      this.productForm.discountAmount().value.set(discount?.amount ?? null);
      this.productForm.isPercentage().value.set(discount?.isPercentage ?? true);

      this.productForm.discountStartDateDate().value.set(start?.date ?? null);
      this.productForm.discountStartDateTime().value.set(start?.time ?? null);
      this.productForm.discountEndDateDate().value.set(end?.date ?? null);
      this.productForm.discountEndDateTime().value.set(end?.time ?? null);

      setTimeout(() => this.isFormDirty.set(false), 0);
    }
  }

  async loadArrayOfDropDownSize(): Promise<void> {
    const chars = this.adminProduct()?.productCharacteristics;
    if (!chars) return;

    this.isInitialLoad = true;
    const standardCharacteristics = chars.map(pc => ({
      id: pc.id,
      productId: pc.productId,
      sizeId: pc.sizeId,
      quantity: pc.quantity
    }));

    this.productModel.update(m => ({
      ...m,
      productCharacteristics: standardCharacteristics
    }));

    setTimeout(() => this.isFormDirty.set(false), 0);
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

  onSubmit() {
    if (!this.isFormValid) {
      this.notificationService.showError('Form Validation Error: Please fill out the form correctly.');
      return;
    }

    const formValues = this.productModel();
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
      updatedDiscount.amount = formValues.discountAmount ?? undefined;

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
      price                 : formValues.price,
      previousPrice         : existingProduct?.previousPrice,
      pictureUrl            : existingProduct?.pictureUrl || '',
      picturePublicId       : existingProduct?.picturePublicId || '',
      productType           : existingProduct?.productType,
      productTypeId         : formValues.productTypeId ?? 0,
      productBrand          : existingProduct?.productBrand,
      productBrandId        : formValues.productBrandId ?? 0,
      isActive              : formValues.isActive,
      productCharacteristics: (formValues.productCharacteristics || []).map(c => ({
        id: c.id,
        productId: c.productId,
        sizeId: c.sizeId,
        quantity: c.quantity,
        sizeName: ''
      })),
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
        this.productForm.price().value.set(returnedProduct.previousPrice ?? returnedProduct.price);
        this.productForm.isDiscountActive().value.set(updatedAdminProduct.discount?.isActive ?? false);

        this.isFormDirty.set(false);
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

  onDiscountToggle(isActive: boolean): void {
    const product = this.adminProduct();
    const discount = product?.discount;

    if (isActive) {
      // Apply existing or default start dates
      if (discount?.startDate) {
        const startDate = new Date(discount.startDate);
        this.productForm.discountStartDateDate().value.set(this.backupStartDate ?? startDate);
        this.productForm.discountStartDateTime().value.set(this.backupStartTime ?? startDate);
      } else {
        const now = new Date();
        this.productForm.discountStartDateDate().value.set(this.backupStartDate ?? now);
        this.productForm.discountStartDateTime().value.set(this.backupStartTime ?? now);
      }

      // Apply existing or default end dates
      if (discount?.endDate) {
        const endDate = new Date(discount.endDate);
        this.productForm.discountEndDateDate().value.set(this.backupEndDate ?? endDate);
        this.productForm.discountEndDateTime().value.set(this.backupEndTime ?? endDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.productForm.discountEndDateDate().value.set(this.backupEndDate ?? tomorrow);
        this.productForm.discountEndDateTime().value.set(this.backupEndTime ?? tomorrow);
      }
    } else {
      // Save backups of the current values before clearing/deactivating
      const formState = this.productModel();
      this.backupStartDate = formState.discountStartDateDate;
      this.backupStartTime = formState.discountStartDateTime;
      this.backupEndDate   = formState.discountEndDateDate;
      this.backupEndTime   = formState.discountEndDateTime;
    }
  }

  private shouldForceSingleDiscount(formValues: any): boolean {
    const productDiscount = this.adminProduct()?.discount;
    if (formValues.isDiscountActive) return true;
    if (!formValues.isDiscountActive && productDiscount?.isActive) return true;
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

  removeSize(index: number) {
    this.productModel.update(m => ({
      ...m,
      productCharacteristics: m.productCharacteristics.filter((_, i) => i !== index)
    }));
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

      this.productModel.update(m => ({
        ...m,
        productCharacteristics: [...m.productCharacteristics, {
          id: 0,
          productId: effectiveProductId,
          sizeId: defaultSizeId,
          quantity: 1
        }]
      }));
      this.dynamicSizeAdded.set(true);
    }

    this.disabledAddSizeButton.set(this.validSizeList.length <= 1);
  }

  getAvailableSizeList(characteristic: any): ISizeClassification[] {
    const currentSizeId = characteristic.sizeId;
    this.validSizeList = this.getValidSizeList(currentSizeId);
    return this.validSizeList;
  }

  getValidSizeList(ignoreSizeId: number = -1): ISizeClassification[] {
    const specs = this.productModel().productCharacteristics;
    return this.sizes().filter(size => {
      return !specs.some(spec => size.id === spec.sizeId && size.id !== ignoreSizeId);
    });
  }

  navigateBack() {
    if (this.isFormDirty()) {
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
    return !(this.isFormValid &&
      (this.isFormDirty() || this.dynamicSizeAdded() || this.dynamicSizeRemoved()));
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
