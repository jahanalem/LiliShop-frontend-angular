import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, signal, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { EMPTY, Subject, catchError, switchMap, takeUntil } from 'rxjs';
import { ProductTypeService } from 'src/app/core/services/product-type.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { IProductType } from 'src/app/shared/models/productType';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { LanguageService } from 'src/app/core/services/language.service';
import { INameTranslation } from 'src/app/shared/models/localization';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

@Component({
    selector: 'app-edit-product-type',
    templateUrl: './edit-product-type.component.html',
    styleUrls: ['./edit-product-type.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    TranslatePipe,RouterModule, MatCheckboxModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatIconModule, ReactiveFormsModule, FormsModule]
})
export class EditProductTypeComponent implements OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  typeForm!: FormGroup;

  type          = signal<IProductType | null>(null);
  typeIdFromUrl = signal<number>(0);

  protected colorCheckbox: ThemePalette;

  private destroy$ = new Subject<void>();

  private typeService    = inject(ProductTypeService);
  private readonly translationService = inject(TranslationService);
  protected languageService = inject(LanguageService);

  /** Per-culture name drafts for the non-default languages (default culture = the main Name field). */
  translationDrafts: Record<string, string> = {};
  private activatedRoute = inject(ActivatedRoute);
  private router         = inject(Router);
  private dialog         = inject(MatDialog);
  private formBuilder    = inject(FormBuilder);

  constructor() {

   }

  ngOnInit() {
    this.getType();
    this.createtypeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createtypeForm() {
    this.typeForm = this.formBuilder.group({
      isActive: [false],
      name: [null, Validators.required]
    });
  }

  getType() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$),
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        this.typeIdFromUrl.set(id === null ? 0 : +id);
        if (this.typeIdFromUrl() && this.typeIdFromUrl() > 0) {
          return this.typeService.getType(this.typeIdFromUrl());
        }
        else {
          return EMPTY;
        }
      }),
      catchError(error => {
        console.error(error);
        return EMPTY;
      })
    ).subscribe((response) => {
      this.type.set(response);
      this.updateTypeForm(response);
      this.applyTranslationDrafts(response);
    });
  }

  updateTypeForm(type: IProductType) {
    this.typeForm.patchValue({
      isActive: type.isActive,
      name: type.name
    });
  }

  get extraLanguages() {
    return this.languageService.languages().filter(l => !l.isDefault);
  }

  private applyTranslationDrafts(type: IProductType): void {
    this.translationDrafts = {};
    // The default culture's name is the main Name field; keeping it out of the drafts
    // prevents a stale duplicate from overriding the edited value on save.
    const defaultCulture = this.languageService.languages().find(l => l.isDefault)?.code;
    for (const translation of type.translations ?? []) {
      if (translation.culture !== defaultCulture) {
        this.translationDrafts[translation.culture] = translation.name;
      }
    }
  }

  private buildTranslationsPayload(defaultName: string): INameTranslation[] {
    const defaultCulture = this.languageService.languages().find(l => l.isDefault)?.code;
    const translations: INameTranslation[] = [];

    if (defaultCulture) {
      translations.push({ culture: defaultCulture, name: defaultName });
    }
    for (const [culture, name] of Object.entries(this.translationDrafts)) {
      if (name?.trim()) {
        translations.push({ culture, name: name.trim() });
      }
    }
    return translations;
  }

  onTranslationChange(): void {
    this.typeForm.markAsDirty();
  }

  onSubmit() {
    const formValue = this.typeForm.value as IProductType;
    const typePayload = { ...this.type(), ...formValue };
    typePayload.translations = this.buildTranslationsPayload(formValue.name);
    delete (typePayload as { [key: string]: any })["createdDate"];
    delete (typePayload as { [key: string]: any })["modifiedDate"];
    const typeAction = typePayload && typePayload.id > 0
      ? this.typeService.updateType(typePayload)
      : this.typeService.createType(typePayload);

    typeAction.subscribe({
      next: () => {
        this.typeForm.markAsPristine();
      },
      error: (error) => {
        console.error(error);
      }
    })
  }

  navigateBack() {
    if (this.typeForm.dirty) {
      const dialogData: IDialogData = {
        title: this.translationService.translate(TranslationKeys.Admin.Common.DiscardTitle),
        content: this.translationService.translate(TranslationKeys.Admin.Common.DiscardContent),
        showConfirmationButtons: true
      };
      const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
        next: (result?: boolean | undefined) => {
          if (result) {
            this.router.navigateByUrl('/admin/product-types');
          }
        },
        error: (error: any) => { console.error(error); }
      });
    } else {
      this.router.navigateByUrl('/admin/product-types');
    }
  }

  onIsActiveChange(event: boolean): void {
    if (!this.type) {
      return;
    }
    this.type.update(type => ({ ...type!, isActive: event }));
  }

  get isSaveDisabled(): boolean {
    return !this.typeForm.dirty || !this.typeForm.valid;
  }
}