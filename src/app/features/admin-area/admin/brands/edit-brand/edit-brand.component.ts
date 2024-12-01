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

@Component({
    selector: 'app-edit-brand',
    templateUrl: './edit-brand.component.html',
    styleUrls: ['./edit-brand.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class EditBrandComponent implements OnInit {
  brandForm!: FormGroup;

  brand          = signal<IBrand | null>(null);
  brandIdFromUrl = signal<number>(0);

  protected colorCheckbox: ThemePalette;

  private destroy$ = new Subject<void>();

  private brandService   = inject(BrandService);
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
    });
  }

  updateBrandForm(brand: IBrand) {
    this.brandForm?.patchValue({
      isActive: brand.isActive,
      name: brand.name
    });
  }

  onSubmit() {
    const formValue = this.brandForm.value as IBrand;
    const brandPayload = { ...this.brand(), ...formValue };
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
