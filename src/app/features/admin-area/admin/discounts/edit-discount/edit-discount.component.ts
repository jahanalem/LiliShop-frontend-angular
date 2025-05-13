import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DiscountTargetType, IDiscount, ITargetEntityOption } from 'src/app/shared/models/discount-system';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDivider } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IBrand } from 'src/app/shared/models/brand';
import { IProductType } from 'src/app/shared/models/productType';
import { ProductService } from 'src/app/core/services/product.service';

@Component({
  selector: 'app-edit-discount',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,

    // Material Modules
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatExpansionModule,
    MatTooltipModule,
    MatStepperModule,
    MatFormFieldModule,
    MatDivider,
    MatCheckboxModule
  ],
  templateUrl: './edit-discount.component.html',
  styleUrl: './edit-discount.component.scss'
})
export class EditDiscountComponent {
  isEditMode = false;

  discountInfoForm!: FormGroup;
  tiersForm!: FormGroup;
  discountGroupForm!: FormGroup;

  targetEntityOptions = [
    { label: 'All', value: DiscountTargetType.All },
    { label: 'Product Type', value: DiscountTargetType.ProductType },
    { label: 'Product Brand', value: DiscountTargetType.ProductBrand }
    //{ label: 'Size', value: DiscountTargetType.Size },
    //{ label: 'Product', value: DiscountTargetType.Product },
  ];

  targetEntityIdOptionsMap = new Map<DiscountTargetType, ITargetEntityOption[]>();

  brands: IBrand[] = [];
  types: IProductType[] = [];
  private productService = inject(ProductService);

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initForms();
    this.loadBrands()
    this.loadTypes();
  }

  loadBrands() {
    this.productService.getBrands(true).subscribe({
      next: (activeBrands: IBrand[]) => {
        this.brands = [{ id: 0, name: 'All' }, ...activeBrands];
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  loadTypes() {
    this.productService.getTypes(true).subscribe({
      next: (activeTypes: IProductType[]) => {
        this.types = [{ id: 0, name: 'All' }, ...activeTypes];
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  private initForms(): void {
    this.discountInfoForm = this.fb.group({
      name: ['',],
      startDate: ['',],
      endDate: ['',],
      isActive: [false]
    });

    this.tiersForm = this.fb.group({
      tiers: this.fb.array([])
    });

    this.discountGroupForm = this.fb.group({
      conditionGroups: this.fb.array([])
    });
  }

  get tiers(): FormArray {
    return this.tiersForm.get('tiers') as FormArray;
  }

  onAddTier(): void {
    this.tiers.push(this.fb.group({
      amount: [0, Validators.required],
      isPercentage: [true],
      isFreeShipping: [false]
    }));
  }

  onRemoveTier(i: number): void {
    this.tiers.removeAt(i);
  }

  get conditionGroups(): FormArray {
    return this.discountGroupForm.get('conditionGroups') as FormArray;
  }

  onAddConditionGroup(): void {
    this.conditionGroups.push(this.fb.group({
      tierIndex: [0, Validators.required],
      conditions: this.fb.array([])
    }));
  }

  onRemoveConditionGroup(i: number): void {
    this.conditionGroups.removeAt(i);
  }

  getConditions(groupIndex: number): FormArray {
    return this.conditionGroups.at(groupIndex).get('conditions') as FormArray;
  }

  onAddCondition(groupIndex: number): void {
    this.getConditions(groupIndex).push(this.fb.group({
      targetEntity: [DiscountTargetType.All, Validators.required],
      targetEntityId: [null, Validators.required],
      shouldNotify: [false]
    }));
  }

  onRemoveCondition(groupIndex: number, conditionIndex: number): void {
    this.getConditions(groupIndex).removeAt(conditionIndex);
  }

  updateTargetEntityIdOptions(targetEntityType: DiscountTargetType) {
    if (!this.targetEntityIdOptionsMap.has(targetEntityType)) {
      let options: ITargetEntityOption[] = [];

      if (targetEntityType === DiscountTargetType.ProductBrand) {
        options = this.brands.map(b => ({ label: b.name, value: b.id }));
      } else if (targetEntityType === DiscountTargetType.ProductType) {
        options = this.types.map(t => ({ label: t.name, value: t.id }));
      }

      this.targetEntityIdOptionsMap.set(targetEntityType, options);
    }
  }
  onTargetEntityChange(i: number, j: number) {
    const control = this.getConditions(i).at(j);
    const targetEntityType = control.get('targetEntity')?.value as DiscountTargetType;

    this.updateTargetEntityIdOptions(targetEntityType);
  }

  onSubmit(): void {
    if (this.discountInfoForm.invalid || this.tiersForm.invalid || this.discountGroupForm.invalid) {
      console.warn('Form invalid');
      return;
    }

    const discount: IDiscount = {
      ...this.discountInfoForm.value,
      tiers: this.tiersForm.value.tiers,
      discountGroup: {
        name: this.discountInfoForm.value.name + '_group', // Or some logic
        conditionGroups: this.discountGroupForm.value.conditionGroups
      }
    };

    if (this.isEditMode) {
      console.log('Update Discount', discount);
      // Call update service
    } else {
      console.log('Create Discount', discount);
      // Call create service
    }
  }
}
