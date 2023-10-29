import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import { ProductTypeService } from 'src/app/core/services/product-type.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { DialogData } from 'src/app/shared/models/dialog-data.interface';
import { IProductType } from 'src/app/shared/models/productType';

@Component({
  selector: 'app-edit-product-type',
  templateUrl: './edit-product-type.component.html',
  styleUrls: ['./edit-product-type.component.scss']
})
export class EditProductTypeComponent {
  typeForm!: FormGroup;
  type: IProductType | null = null;
  typeIdFromUrl: number = 0;
  protected colorCheckbox: ThemePalette;

  constructor(private typeService: ProductTypeService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private formBuilder: FormBuilder) {

  }
  ngOnInit() {
    this.getType();
    this.createtypeForm();
  }

  createtypeForm() {
    this.typeForm = this.formBuilder.group({
      isActive: [false],
      name: [null, Validators.required]
    });
  }

  getType() {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        this.typeIdFromUrl = (id === null ? 0 : +id);
        if (this.typeIdFromUrl && this.typeIdFromUrl > 0) {
          return this.typeService.getType(this.typeIdFromUrl);
        }
        else {
          return EMPTY;
        }
      }),
      tap(response => {
        this.type = response;
      }),
      catchError(error => {
        console.error(error);
        return EMPTY;
      })
    ).subscribe((response) => {
      this.type = response;
      this.updatetypeForm(response);
    });
  }

  updatetypeForm(type: IProductType) {
    this.typeForm?.patchValue({
      isActive: type.isActive,
      name: type.name
    });
  }


  onSubmit() {
    const formValue = this.typeForm.value as IProductType;
    const typePayload = { ...this.type, ...formValue };
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
      const dialogData: DialogData = {
        title: 'Discard change',
        content: 'Would you like to discard your changes?',
        showConfirmationButtons: true
      };
      const dialogRef = this.dialog.open<DialogComponent, DialogData>(DialogComponent, { data: dialogData });

      dialogRef.afterClosed().subscribe({
        next: (result?: boolean | undefined) => {
          if (result) {
            this.router.navigateByUrl('/admin/product-types');
          }
        },
        error: (error) => { console.error(error); }
      });
    } else {
      this.router.navigateByUrl('/admin/product-types');
    }
  }

  onIsActiveChange(event: boolean): void {
    if (!this.type) {
      return;
    }
    this.type.isActive = event;
  }

  get isSaveDisabled(): boolean {
    return !this.typeForm.dirty || !this.typeForm.valid;
  }
}
