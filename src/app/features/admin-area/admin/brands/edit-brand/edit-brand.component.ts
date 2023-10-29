import { IBrand } from 'src/app/shared/models/brand';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { BrandService } from 'src/app/core/services/brand.service';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DialogData } from 'src/app/shared/models/dialog-data.interface';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-brand',
  templateUrl: './edit-brand.component.html',
  styleUrls: ['./edit-brand.component.scss']
})
export class EditBrandComponent implements OnInit {
  brandForm!: FormGroup;
  brand: IBrand | null = null;
  brandIdFromUrl: number = 0;
  protected colorCheckbox: ThemePalette;

  constructor(private brandService: BrandService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private formBuilder: FormBuilder) {

  }
  ngOnInit() {
    this.getBrand();
    this.createBrandForm();
  }

  createBrandForm() {
    this.brandForm = this.formBuilder.group({
      isActive: [false],
      name: [null, Validators.required]
    });
  }

  getBrand() {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        this.brandIdFromUrl = (id === null ? 0 : +id);
        if (this.brandIdFromUrl && this.brandIdFromUrl > 0) {
          return this.brandService.getBrand(this.brandIdFromUrl);
        }
        else {
          return EMPTY;
        }
      }),
      tap(response => {
        this.brand = response;
      }),
      catchError(error => {
        console.error(error);
        return EMPTY;
      })
    ).subscribe((response) => {
      this.brand = response;
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
    const brandPayload = { ...this.brand, ...formValue };
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
      const dialogData: DialogData = {
        title: 'Discard change',
        content: 'Would you like to discard your changes?',
        showConfirmationButtons: true
      };
      const dialogRef = this.dialog.open<DialogComponent, DialogData>(DialogComponent, { data: dialogData });

      dialogRef.afterClosed().subscribe({
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
    if (!this.brand) {
      return;
    }
    this.brand.isActive = event;
  }

  get isSaveDisabled(): boolean {
    return !this.brandForm.dirty || !this.brandForm.valid;
  }

}
