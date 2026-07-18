import { PhotoEditorComponent } from 'src/app/shared/components/photo-editor/photo-editor.component';
import { ProductVariantsEditorComponent } from './product-variants-editor/product-variants-editor.component';
import { MatButtonModule } from '@angular/material/button';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { form, required, min, max, FormField } from '@angular/forms/signals';
import { Observable, Subject, firstValueFrom, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';

import { IProduct, IProductAdmin } from './../../../../../shared/models/product';
import { IBrand } from 'src/app/shared/models/brand';
import { IProductType } from 'src/app/shared/models/productType';
import { ISingleDiscount } from 'src/app/shared/models/discount';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';

import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { ProductService } from 'src/app/core/services/product.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { IProductTranslation } from 'src/app/shared/models/localization';
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
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';


interface ProductFormModel {
  isActive: boolean;
  name: string;
  description: string;
  price: number;
  productBrandId: number | null;
  productTypeId: number | null;
  isDiscountActive: boolean;
  discountAmount: number | null;
  isPercentage: boolean;
  discountStartDateDate: Date | null;
  discountStartDateTime: Date | null;
  discountEndDateDate: Date | null;
  discountEndDateTime: Date | null;
}

const EMPTY_FORM_MODEL: ProductFormModel = {
  isActive: false,
  name: '',
  description: '',
  price: 0,
  productBrandId: null,
  productTypeId: null,
  isDiscountActive: false,
  discountAmount: null,
  isPercentage: true,
  discountStartDateDate: null,
  discountStartDateTime: null,
  discountEndDateDate: null,
  discountEndDateTime: null,
};

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslatePipe,FormField, FormsModule, MatFormFieldModule, MatInputModule, MatTableModule, MatIconModule, MatSelectModule, MatCheckboxModule, MatTooltipModule, MatTabsModule, MatDatepickerModule, MatTimepickerModule, MatNativeDateModule, PhotoEditorComponent, ProductVariantsEditorComponent, MatButtonModule],
})
export class EditProductComponent implements OnInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;


  private readonly dialog = inject(MatDialog);
  private readonly translationService = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  protected readonly languageService = inject(LanguageService);
  private readonly storageService = inject(StorageService);
  private readonly discountService = inject(DiscountService);
  private readonly notificationService = inject(NotificationService);

  private readonly destroy$ = new Subject<void>();

  // Reference data for the dropdowns.
  readonly brands = signal<IBrand[]>([]);
  readonly types = signal<IProductType[]>([]);

  // The product currently being edited (undefined while creating a new one).
  readonly adminProduct = signal<IProductAdmin | undefined>(undefined);

  // Backups used to restore discount dates when the user toggles the discount off/on.
  private backupStartDate: Date | null = null;
  private backupStartTime: Date | null = null;
  private backupEndDate: Date | null = null;
  private backupEndTime: Date | null = null;

  private productIdFromUrl = 0;

  readonly productModel = signal<ProductFormModel>({ ...EMPTY_FORM_MODEL });

  /**
   * Per-culture content drafts for the NON-default languages; the default language's content
   * is the main Name/Description fields. Keyed by culture code.
   */
  translationDrafts: Record<string, { name: string; description: string; seoTitle: string; seoDescription: string }> = {};
  private readonly translationsDirty = signal(false);

  /** Active languages except the default one (its content lives in the main fields). */
  readonly extraLanguages = computed(() =>
    this.languageService.languages().filter(l => !l.isDefault));

  readonly productForm = form(this.productModel, (p) => {
    required(p.name);
    required(p.description);
    required(p.price);
    min(p.price, 1);
    max(p.price, 10000);
    required(p.productBrandId);
    required(p.productTypeId);
  });

  private readonly pristineSnapshot = signal(this.snapshot(EMPTY_FORM_MODEL));

  readonly isFormValid = computed(() => {
    const v = this.productModel();
    return !!(
      v.name?.trim() &&
      v.description?.trim() &&
      v.price >= 1 &&
      v.price <= 10000 &&
      v.productBrandId !== null &&
      v.productTypeId !== null
    );
  });

  readonly isFormDirty = computed(
    () => this.snapshot(this.productModel()) !== this.pristineSnapshot() || this.translationsDirty()
  );

  readonly isSaveDisabled = computed(() => !(this.isFormValid() && this.isFormDirty()));

  readonly isProductIdValid = computed(() => (this.adminProduct()?.id ?? 0) > 0);

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([this.loadBrands(), this.loadTypes()]);
      await this.loadProduct();
      this.cacheProduct();
      this.markPristine();
    } catch (error) {
      console.error('Failed to initialise the product form:', error);
    }
  }

  ngOnDestroy(): void {
    this.storageService.delete(this.getProductKey());
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data loading -------------------------------------------------------

  private async loadBrands(): Promise<void> {
    this.brands.set(await this.fetch(this.productService.getBrands(true)));
  }

  private async loadTypes(): Promise<void> {
    this.types.set(await this.fetch(this.productService.getTypes(true)));
  }

  private async loadProduct(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.productIdFromUrl = idParam ? +idParam : 0;
    if (this.productIdFromUrl <= 0) {
      return;
    }

    try {
      const product = await this.fetch(this.productService.getProduct(this.productIdFromUrl));
      if (!product) {
        return;
      }

      const adminProduct = product as IProductAdmin;
      if (adminProduct.id > 0) {
        adminProduct.discount =
          (await this.fetch(this.discountService.getSingleDiscountForProduct(adminProduct.id))) ?? null;
      }

      // GET /products/{id} localizes name/description for the admin's UI language; the raw
      // per-culture rows are the source of truth for this form. The default-culture row feeds
      // the main fields (never a translation), the rest become drafts.
      await this.applyTranslations(adminProduct);

      this.adminProduct.set(adminProduct);
      this.productModel.set(this.toFormModel(adminProduct));
    } catch (error) {
      console.error('Error loading product:', error);
    }
  }

  private cacheProduct(): void {
    const product = this.adminProduct();
    if (product) {
      this.storageService.set(this.getProductKey(), JSON.stringify(product));
    }
  }

  private getProductKey(): string {
    return `productKey_${this.route.snapshot.paramMap.get('id')}`;
  }

  // --- Submit -------------------------------------------------------------

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.notificationService.showError(this.translationService.translate(TranslationKeys.Admin.Products.FormInvalid));
      return;
    }

    const values = this.productModel();
    const existing = this.adminProduct();
    const isUpdate = !!existing && existing.id > 0;
    const oldDiscount = existing?.discount;

    const discountPayload = this.shouldForceSingleDiscount(values)
      ? this.buildDiscountPayload(values, oldDiscount)
      : null;

    const productPayload: IProductAdmin = {
      id                    : existing?.id ?? 0,
      name                  : values.name,
      description           : values.description,
      price                 : values.price,
      previousPrice         : existing?.previousPrice,
      pictureUrl            : existing?.pictureUrl ?? '',
      picturePublicId       : existing?.picturePublicId ?? '',
      productType           : existing?.productType,
      productTypeId         : values.productTypeId ?? 0,
      productBrand          : existing?.productBrand,
      productBrandId        : values.productBrandId ?? 0,
      isActive              : values.isActive,
      // Sizes/stock are managed by the variants editor (which keeps these legacy rows in
      // sync server-side); the product save must not touch them.
      productCharacteristics: existing?.productCharacteristics ?? [],
      productPhotos         : existing?.productPhotos ?? [],
      discount              : discountPayload,
      translations          : this.buildTranslationsPayload(values),
    };

    const save$ = isUpdate
      ? this.productService.updateProduct(productPayload)
      : this.productService.createProduct(productPayload);

    save$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (returnedProduct: IProduct) => {
        this.adminProduct.set({
          ...returnedProduct,
          discount: discountPayload ?? oldDiscount ?? null,
        });

        // Re-sync the few server-computed fields, then mark the form as saved.
        this.productModel.update(m => ({
          ...m,
          price: returnedProduct.previousPrice ?? returnedProduct.price,
          isDiscountActive: discountPayload?.isActive ?? oldDiscount?.isActive ?? false,
        }));
        this.translationsDirty.set(false);
        this.markPristine();

        const action = isUpdate ? 'updated' : 'created';
        this.notificationService.showSuccess(`Success: Product ${action} successfully.`);
      },
      error: (error) => {
        this.notificationService.showError(this.translationService.translate(TranslationKeys.Admin.Products.SaveError));
        console.error('Error saving product:', error);
      },
    });
  }

  private async applyTranslations(adminProduct: IProductAdmin): Promise<void> {
    this.translationDrafts = {};
    let rows: IProductTranslation[] = [];
    try {
      rows = await this.fetch(this.productService.getProductTranslations(adminProduct.id)) ?? [];
    } catch (error) {
      console.error('Failed to load product translations:', error);
    }

    const defaultCulture = this.languageService.languages().find(l => l.isDefault)?.code;
    for (const row of rows) {
      if (row.culture === defaultCulture) {
        adminProduct.name = row.name;
        adminProduct.description = row.description;
        continue;
      }
      this.translationDrafts[row.culture] = {
        name          : row.name ?? '',
        description   : row.description ?? '',
        seoTitle      : row.seoTitle ?? '',
        seoDescription: row.seoDescription ?? '',
      };
    }
    this.translationsDirty.set(false);
  }

  draftFor(culture: string): { name: string; description: string; seoTitle: string; seoDescription: string } {
    return this.translationDrafts[culture] ??= { name: '', description: '', seoTitle: '', seoDescription: '' };
  }

  onTranslationChange(): void {
    this.translationsDirty.set(true);
  }

  private buildTranslationsPayload(values: ProductFormModel): IProductTranslation[] {
    const translations: IProductTranslation[] = [];

    const defaultCulture = this.languageService.languages().find(l => l.isDefault)?.code;
    if (defaultCulture) {
      translations.push({
        culture: defaultCulture,
        name: values.name,
        description: values.description,
      });
    }

    for (const [culture, draft] of Object.entries(this.translationDrafts)) {
      if (culture === defaultCulture || !draft.name?.trim()) {
        continue; // no name = fall back to the default language for this culture
      }
      translations.push({
        culture,
        name          : draft.name.trim(),
        description   : draft.description?.trim() || values.description,
        seoTitle      : draft.seoTitle?.trim() || null,
        seoDescription: draft.seoDescription?.trim() || null,
      });
    }

    return translations;
  }

  private buildDiscountPayload(
    values: ProductFormModel,
    oldDiscount: Partial<ISingleDiscount> | null | undefined
  ): Partial<ISingleDiscount> {
    return {
      ...(oldDiscount?.id ? { id: oldDiscount.id } : {}),
      isActive: values.isDiscountActive,
      name: 'Single Discount',
      isPercentage: values.isPercentage,
      amount: values.discountAmount ?? undefined,
      startDate: this.combineDateAndTime(values.discountStartDateDate, values.discountStartDateTime)?.toISOString(),
      endDate: this.combineDateAndTime(values.discountEndDateDate, values.discountEndDateTime)?.toISOString(),
    };
  }

  private shouldForceSingleDiscount(values: ProductFormModel): boolean {
    return values.isDiscountActive || !!this.adminProduct()?.discount?.isActive;
  }

  // --- Discount toggle ----------------------------------------------------

  onDiscountToggle(isActive: boolean): void {
    if (!isActive) {
      // Back up the current dates so they can be restored if re-enabled.
      const v = this.productModel();
      this.backupStartDate = v.discountStartDateDate;
      this.backupStartTime = v.discountStartDateTime;
      this.backupEndDate   = v.discountEndDateDate;
      this.backupEndTime   = v.discountEndDateTime;
      return;
    }

    const discount = this.adminProduct()?.discount;
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = discount?.startDate ? new Date(discount.startDate) : now;
    const end = discount?.endDate ? new Date(discount.endDate) : tomorrow;

    this.productModel.update(m => ({
      ...m,
      discountStartDateDate: this.backupStartDate ?? start,
      discountStartDateTime: this.backupStartTime ?? start,
      discountEndDateDate  : this.backupEndDate ?? end,
      discountEndDateTime  : this.backupEndTime ?? end,
    }));
  }

  // --- Navigation ---------------------------------------------------------

  navigateBack(): void {
    if (!this.isFormDirty()) {
      this.router.navigateByUrl('/admin/products');
      return;
    }

    const dialogData: IDialogData = {
      title: this.translationService.translate(TranslationKeys.Admin.Common.DiscardTitle),
      content: this.translationService.translate(TranslationKeys.Admin.Common.DiscardContent),
      showConfirmationButtons: true,
    };

    this.dialog
      .open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (confirmed?: boolean) => {
          if (confirmed) {
            this.router.navigateByUrl('/admin/products');
          }
        },
        error: (error) => console.error(error),
      });
  }

  isDiscountGroup(): boolean {
    const groupId = this.adminProduct()?.discount?.discountGroupId;
    return !!groupId && groupId > 0;
  }

  // --- Helpers ------------------------------------------------------------

  private toFormModel(product: IProductAdmin): ProductFormModel {
    const discount = product.discount;
    const start = this.extractDateTime(discount?.startDate);
    const end = this.extractDateTime(discount?.endDate);

    return {
      isActive              : product.isActive,
      name                  : product.name,
      description           : product.description,
      price                 : product.previousPrice ?? product.price,
      productBrandId        : product.productBrandId,
      productTypeId         : product.productTypeId,
      isDiscountActive     : discount?.isActive ?? false,
      discountAmount       : discount?.amount ?? null,
      isPercentage         : discount?.isPercentage ?? true,
      discountStartDateDate: start.date,
      discountStartDateTime: start.time,
      discountEndDateDate  : end.date,
      discountEndDateTime  : end.time,
    };
  }

  private combineDateAndTime(date: Date | null, time: Date | null): Date | null {
    if (!date || !time) {
      return null;
    }
    const combined = new Date(date);
    const t = new Date(time);
    if (!isNaN(t.getTime())) {
      combined.setHours(t.getHours(), t.getMinutes(), 0, 0);
    }
    return combined;
  }

  private extractDateTime(value: string | null | undefined): { date: Date | null; time: Date | null } {
    if (!value) {
      return { date: null, time: null };
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return { date: null, time: null };
    }
    return {
      date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      time: new Date(1970, 0, 1, d.getHours(), d.getMinutes()),
    };
  }

  private snapshot(model: ProductFormModel): string {
    return JSON.stringify(model);
  }

  private markPristine(): void {
    this.pristineSnapshot.set(this.snapshot(this.productModel()));
  }

  private fetch<T>(source$: Observable<T>): Promise<T> {
    return firstValueFrom(source$.pipe(takeUntil(this.destroy$)));
  }
}