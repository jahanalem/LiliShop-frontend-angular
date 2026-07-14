import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { IBrand } from 'src/app/shared/models/brand';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { BrandService } from 'src/app/core/services/brand.service';
import { EMPTY, Subject, catchError, switchMap, takeUntil, tap } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { LanguageService } from 'src/app/core/services/language.service';
import { INameTranslation } from 'src/app/shared/models/localization';

@Component({
    selector: 'app-edit-brand',
    templateUrl: './edit-brand.component.html',
    styleUrls: ['./edit-brand.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [RouterModule, MatCheckboxModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatIconModule, ReactiveFormsModule, FormsModule]
})
export class EditBrandComponent implements OnInit {
  brandForm!: FormGroup;

  brand          = signal<IBrand | null>(null);
  brandIdFromUrl = signal<number>(0);

  protected colorCheckbox: ThemePalette;

  private destroy$ = new Subject<void>();

  private brandService   = inject(BrandService);
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
    this.getBrand();
    this.createBrandForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createBrandForm() {
    this.brandForm = this.formBuilder.group({
      isActive: [false],
      name: [null, Validators.required]
    });
  }

  getBrand() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$),
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        this.brandIdFromUrl.set((id === null ? 0 : +id));
        if (this.brandIdFromUrl() && this.brandIdFromUrl() > 0) {
          return this.brandService.getBrand(this.brandIdFromUrl());
        }
        else {
          return EMPTY;
        }
      }),
      tap(response => {
        this.brand.set(response);
      }),
      catchError(error => {
        console.error(error);
        return EMPTY;
      })
    ).subscribe((response) => {
      this.brand.set(response);
      this.updateBrandForm(response);
      this.applyTranslationDrafts(response);
    });
  }

  updateBrandForm(brand: IBrand) {
    this.brandForm?.patchValue({
      isActive: brand.isActive,
      name: brand.name
    });
  }

  /** Active languages except the default one (its content is the main Name field). */
  get extraLanguages() {
    return this.languageService.languages().filter(l => !l.isDefault);
  }

  private applyTranslationDrafts(brand: IBrand): void {
    this.translationDrafts = {};
    // The default culture's name is the main Name field; keeping it out of the drafts
    // prevents a stale duplicate from overriding the edited value on save.
    const defaultCulture = this.languageService.languages().find(l => l.isDefault)?.code;
    for (const translation of brand.translations ?? []) {
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
    this.brandForm.markAsDirty();
  }

  onSubmit() {
    const formValue = this.brandForm.value as IBrand;
    const brandPayload = { ...this.brand(), ...formValue };
    brandPayload.translations = this.buildTranslationsPayload(formValue.name);
    delete (brandPayload as { [key: string]: any })["createdDate"];
    delete (brandPayload as { [key: string]: any })["modifiedDate"];
    const brandAction = brandPayload && brandPayload.id > 0
      ? this.brandService.updateBrand(brandPayload)
      : this.brandService.createBrand(brandPayload);

    brandAction.subscribe({
      next: () => {
        this.brandForm.markAsPristine();
      },
      error: (error) => {
        console.error(error);
      }
    })
  }

  navigateBack() {
    if (this.brandForm.dirty) {
      const dialogData: IDialogData = {
        title: 'Discard change',
        content: 'Would you like to discard your changes?',
        showConfirmationButtons: true
      };
      const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
        next: (result?: boolean | undefined) => {
          if (result) {
            this.router.navigateByUrl('/admin/brands');
          }
        },
        error: (error) => { console.error(error); }
      });
    } else {
      this.router.navigateByUrl('/admin/brands');
    }
  }

  onIsActiveChange(event: boolean): void {
    if (!this.brand()) {
      return;
    }
    this.brand.update(brand => ({ ...brand!, isActive: event }));
  }

  get isSaveDisabled(): boolean {
    return !this.brandForm.dirty || !this.brandForm.valid;
  }
}