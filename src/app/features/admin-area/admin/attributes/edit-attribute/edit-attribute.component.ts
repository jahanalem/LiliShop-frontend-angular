import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Subject, catchError, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { ProductAttributeService } from 'src/app/core/services/product-attribute.service';
import {
  AttributeInputType,
  AttributeSwatchType,
  IProductAttribute,
  IProductAttributeValue
} from 'src/app/shared/models/productAttribute';
import { INameTranslation } from 'src/app/shared/models/localization';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { LanguageService } from 'src/app/core/services/language.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

/** One editable value row; `translations` holds per-culture name drafts for the non-default languages. */
interface ValueDraft {
  id: number;
  code: string;
  name: string;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: Record<string, string>;
  expanded: boolean;
}

@Component({
    selector: 'app-edit-attribute',
    templateUrl: './edit-attribute.component.html',
    styleUrls: ['./edit-attribute.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    TranslatePipe, RouterModule, MatCheckboxModule, MatFormFieldModule, MatButtonModule, MatInputModule,
    MatSelectModule, MatIconModule, ReactiveFormsModule, FormsModule]
})
export class EditAttributeComponent implements OnInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  attributeForm!: FormGroup;

  attribute          = signal<IProductAttribute | null>(null);
  attributeIdFromUrl = signal<number>(0);
  values             = signal<ValueDraft[]>([]);
  errorMessage       = signal<string>('');

  readonly inputTypes: { value: AttributeInputType; labelKey: string }[] = [
    { value: 'Select',      labelKey: TranslationKeys.Admin.Attributes.InputTypeSelect },
    { value: 'MultiSelect', labelKey: TranslationKeys.Admin.Attributes.InputTypeMultiSelect }
  ];

  readonly swatchTypes: { value: AttributeSwatchType; labelKey: string }[] = [
    { value: 'None',     labelKey: TranslationKeys.Admin.Attributes.SwatchTypeNone },
    { value: 'ColorHex', labelKey: TranslationKeys.Admin.Attributes.SwatchTypeColorHex },
    { value: 'Image',    labelKey: TranslationKeys.Admin.Attributes.SwatchTypeImage }
  ];

  private destroy$ = new Subject<void>();

  private attributeService = inject(ProductAttributeService);
  private readonly translationService = inject(TranslationService);
  protected languageService = inject(LanguageService);

  /** Per-culture name drafts for the attribute itself (default culture = the main Name field). */
  translationDrafts: Record<string, string> = {};

  private activatedRoute = inject(ActivatedRoute);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);
  private formBuilder    = inject(FormBuilder);

  ngOnInit() {
    this.createAttributeForm();
    this.getAttribute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createAttributeForm() {
    this.attributeForm = this.formBuilder.group({
      isActive: [true],
      name: [null, Validators.required],
      code: [null, [Validators.required, Validators.pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/)]],
      inputType: ['Select' as AttributeInputType, Validators.required],
      swatchType: ['None' as AttributeSwatchType, Validators.required],
      isFilterable: [true],
      displayOrder: [0]
    });
  }

  getAttribute() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$),
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        this.attributeIdFromUrl.set((id === null ? 0 : +id));
        if (this.attributeIdFromUrl() && this.attributeIdFromUrl() > 0) {
          return this.attributeService.getAttribute(this.attributeIdFromUrl());
        }
        return EMPTY;
      }),
      catchError(error => {
        console.error(error);
        return EMPTY;
      })
    ).subscribe((response) => {
      this.attribute.set(response);
      this.updateAttributeForm(response);
      this.applyTranslationDrafts(response);
      this.applyValueDrafts(response);
    });
  }

  updateAttributeForm(attribute: IProductAttribute) {
    this.attributeForm?.patchValue({
      isActive: attribute.isActive,
      name: attribute.name,
      code: attribute.code,
      inputType: attribute.inputType,
      swatchType: attribute.swatchType,
      isFilterable: attribute.isFilterable,
      displayOrder: attribute.displayOrder
    });
  }

  /** Active languages except the default one (its content is the main Name field). */
  get extraLanguages() {
    return this.languageService.languages().filter(l => !l.isDefault);
  }

  get isColorSwatch(): boolean {
    return this.attributeForm?.get('swatchType')?.value === 'ColorHex';
  }

  private get defaultCulture(): string | undefined {
    return this.languageService.languages().find(l => l.isDefault)?.code;
  }

  private applyTranslationDrafts(attribute: IProductAttribute): void {
    this.translationDrafts = {};
    for (const translation of attribute.translations ?? []) {
      if (translation.culture !== this.defaultCulture) {
        this.translationDrafts[translation.culture] = translation.name;
      }
    }
  }

  private applyValueDrafts(attribute: IProductAttribute): void {
    const defaultCulture = this.defaultCulture;
    this.values.set((attribute.values ?? []).map(value => ({
      id: value.id,
      code: value.code,
      name: value.name,
      colorHex: value.colorHex ?? null,
      sortOrder: value.sortOrder,
      isActive: value.isActive,
      translations: Object.fromEntries(
        (value.translations ?? [])
          .filter(t => t.culture !== defaultCulture)
          .map(t => [t.culture, t.name])),
      expanded: false
    })));
  }

  // --- Value rows ----------------------------------------------------------

  addValue(): void {
    const nextSortOrder = Math.max(0, ...this.values().map(v => v.sortOrder)) + 10;
    this.values.update(rows => [
      ...rows,
      { id: 0, code: '', name: '', colorHex: null, sortOrder: nextSortOrder, isActive: true, translations: {}, expanded: false }
    ]);
    this.attributeForm.markAsDirty();
  }

  updateValue(index: number, patch: Partial<ValueDraft>): void {
    this.values.update(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
    this.attributeForm.markAsDirty();
  }

  updateValueTranslation(index: number, culture: string, name: string): void {
    this.values.update(rows => rows.map((row, i) =>
      i === index ? { ...row, translations: { ...row.translations, [culture]: name } } : row));
    this.attributeForm.markAsDirty();
  }

  toggleValueTranslations(index: number): void {
    this.values.update(rows => rows.map((row, i) => i === index ? { ...row, expanded: !row.expanded } : row));
  }

  removeValue(index: number): void {
    const row = this.values()[index];
    if (!row) {
      return;
    }

    // Unsaved row: just drop it locally.
    if (row.id === 0) {
      this.values.update(rows => rows.filter((_, i) => i !== index));
      this.attributeForm.markAsDirty();
      return;
    }

    // Persisted value: confirm, then delete server-side (the API refuses referenced values).
    const dialogData: IDialogData = {
      title: this.translationService.translate(TranslationKeys.Admin.Common.DeleteTitle),
      content: this.translationService.translate(TranslationKeys.Admin.Common.DeleteContent),
      showConfirmationButtons: true
    };
    const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
      next: (confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }
        this.attributeService.deleteValue(this.attributeIdFromUrl(), row.id).subscribe({
          next: () => {
            this.values.update(rows => rows.filter((_, i) => i !== index));
          },
          error: (error) => {
            console.error(error);
            this.errorMessage.set(error?.error?.message ?? 'Delete failed.');
          }
        });
      },
      error: (error) => { console.error(error); }
    });
  }

  // --- Save ----------------------------------------------------------------

  private buildTranslationsPayload(defaultName: string, drafts: Record<string, string>): INameTranslation[] {
    const translations: INameTranslation[] = [];
    if (this.defaultCulture) {
      translations.push({ culture: this.defaultCulture, name: defaultName });
    }
    for (const [culture, name] of Object.entries(drafts)) {
      if (name?.trim()) {
        translations.push({ culture, name: name.trim() });
      }
    }
    return translations;
  }

  onTranslationChange(): void {
    this.attributeForm.markAsDirty();
  }

  onSubmit() {
    if (this.attributeForm.invalid) {
      return;
    }

    this.errorMessage.set('');
    const formValue = this.attributeForm.value;

    const payload: IProductAttribute = {
      id: this.attributeIdFromUrl() > 0 ? this.attributeIdFromUrl() : 0,
      code: formValue.code,
      name: formValue.name,
      inputType: formValue.inputType,
      swatchType: formValue.swatchType,
      isFilterable: formValue.isFilterable,
      displayOrder: formValue.displayOrder ?? 0,
      isActive: formValue.isActive,
      translations: this.buildTranslationsPayload(formValue.name, this.translationDrafts),
      values: this.values()
        .filter(row => row.code?.trim() && row.name?.trim())
        .map(row => ({
          id: row.id,
          productAttributeId: this.attributeIdFromUrl() > 0 ? this.attributeIdFromUrl() : 0,
          code: row.code.trim(),
          name: row.name.trim(),
          colorHex: this.isColorSwatch ? row.colorHex : null,
          sortOrder: row.sortOrder,
          isActive: row.isActive,
          translations: this.buildTranslationsPayload(row.name.trim(), row.translations)
        } satisfies IProductAttributeValue))
    };

    const attributeAction = payload.id > 0
      ? this.attributeService.updateAttribute(payload)
      : this.attributeService.createAttribute(payload);

    attributeAction.subscribe({
      next: (saved) => {
        this.attributeForm.markAsPristine();
        if (payload.id === 0 && saved?.id) {
          // Continue editing the persisted attribute (value deletes need its id).
          this.router.navigateByUrl(`/admin/attributes/edit/${saved.id}`);
        } else {
          this.getAttributeById(payload.id);
        }
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set(error?.error?.message ?? 'Save failed.');
      }
    });
  }

  /** Re-fetch after save so value rows get their DB ids (needed for per-value delete). */
  private getAttributeById(id: number): void {
    this.attributeService.getAttribute(id).subscribe({
      next: (response) => {
        this.attribute.set(response);
        this.updateAttributeForm(response);
        this.applyTranslationDrafts(response);
        this.applyValueDrafts(response);
      },
      error: (error) => { console.error(error); }
    });
  }

  navigateBack() {
    if (this.attributeForm.dirty) {
      const dialogData: IDialogData = {
        title: this.translationService.translate(TranslationKeys.Admin.Common.DiscardTitle),
        content: this.translationService.translate(TranslationKeys.Admin.Common.DiscardContent),
        showConfirmationButtons: true
      };
      const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
        next: (result?: boolean | undefined) => {
          if (result) {
            this.router.navigateByUrl('/admin/attributes');
          }
        },
        error: (error) => { console.error(error); }
      });
    } else {
      this.router.navigateByUrl('/admin/attributes');
    }
  }

  get isSaveDisabled(): boolean {
    return !this.attributeForm.dirty || !this.attributeForm.valid;
  }
}
