import { Component, inject, signal } from '@angular/core';

import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterModule } from '@angular/router';

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
import { DiscountTargetType, IDiscount, ITargetEntityOption, ITierOption } from 'src/app/shared/models/discount-system';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDivider } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IBrand } from 'src/app/shared/models/brand';
import { IProductType } from 'src/app/shared/models/productType';
import { ProductService } from 'src/app/core/services/product.service';
import { DiscountService } from 'src/app/core/services/discount.service';
import { catchError, firstValueFrom, of, Subject, switchMap, takeUntil } from 'rxjs';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-edit-discount',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
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
    MatDivider,
    MatCheckboxModule
],
  templateUrl: './edit-discount.component.html',
  styleUrl: './edit-discount.component.scss'
})
export class EditDiscountComponent {
  isEditMode = false;
  discountIdFromUrl      : number = 0;                     // 0 means new discount

  discountInfoForm! : FormGroup;
  tiersForm!        : FormGroup;
  discountGroupForm!: FormGroup;

  brands: IBrand[]       = [];
  types : IProductType[] = [];
  tierOptions     = signal<ITierOption[]>([]);

  discount = signal<IDiscount | undefined>(undefined);

  targetEntityOptions = [
    { label: 'All', value: DiscountTargetType.All },
    { label: 'Product Brand', value: DiscountTargetType.ProductBrand },
    { label: 'Product Type', value: DiscountTargetType.ProductType }
  ];
  targetEntityIdOptionsMap = new Map<DiscountTargetType, ITargetEntityOption[]>();

  private productService  = inject(ProductService);
  private discountService = inject(DiscountService);
  private fb              = inject(FormBuilder);
  private activatedRoute  = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  destroy$ = new Subject<void>();

  constructor() { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async ngOnInit(): Promise<void> {
    this.initForms();
    this.loadBrands()
    this.loadTypes();
    await this.loadDiscount();
  }

  private initForms(): void {
    const today        = new Date();
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);

    const defaultName        = `discount - ${this.formatDate(today)}`;
    const formattedToday     = this.formatDateForInput(today);          // yyyy-MM-dd
    const formattedWeekLater = this.formatDateForInput(oneWeekLater);   // yyyy-MM-dd

    this.discountInfoForm = this.fb.group({
      id       : [0],
      name     : [defaultName, Validators.required],
      startDate: [formattedToday, Validators.required],
      endDate  : [formattedWeekLater, Validators.required],
      isActive : [false]
    });

    this.tiersForm = this.fb.group({
      tiers: this.fb.array([])
    });

    this.discountGroupForm = this.fb.group({
      conditionGroups: this.fb.array([], [this.uniqueBrandTypePairValidator()])
    });
  }

  get tiers(): FormArray {
    return this.tiersForm.get('tiers') as FormArray;
  }
  get conditions(): FormArray {
    return this.discountGroupForm.get('conditionGroups') as FormArray;
  }
  get conditionGroups(): FormArray {
    return this.discountGroupForm.get('conditionGroups') as FormArray;
  }
  getConditions(groupIndex: number): FormArray {
    return this.conditionGroups.at(groupIndex).get('conditions') as FormArray;
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
async loadDiscount(): Promise<void> {
  try {
    const fetchedDiscount = await firstValueFrom(
      this.activatedRoute.paramMap.pipe(
        switchMap((params: ParamMap) => {
          const id = params.get('id');
          this.discountIdFromUrl = (id === null ? 0 : +id);
          if (this.discountIdFromUrl > 0) {
            return this.discountService.getDiscount(this.discountIdFromUrl);
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

    if (fetchedDiscount) {
      this.discount.set(fetchedDiscount);
      this.isEditMode = true;
      // 1. Populate Discount Info Form
      this.discountInfoForm.patchValue({
        id: fetchedDiscount.id,
        name: fetchedDiscount.name,
        startDate: this.formatDateForInput(new Date(fetchedDiscount.startDate)),
        endDate: this.formatDateForInput(new Date(fetchedDiscount.endDate)),
        isActive: fetchedDiscount.isActive
      });

      // 2. Populate Tiers Form Array
      const tiersArray = this.tiers;
      tiersArray.clear();
      fetchedDiscount.tiers?.forEach(tier => {
        tiersArray.push(this.fb.group({
          amount: [tier.amount],
          isPercentage: [tier.isPercentage],
          isFreeShipping: [tier.isFreeShipping]
        }, { validators: this.amountValidator() }));
      });
      this.updateTierOptions(); // Update signal-based options

      // 3. Populate Condition Groups Form Array
      const conditionGroupsArray = this.conditionGroups;
      conditionGroupsArray.clear();
      fetchedDiscount.discountGroup?.conditionGroups.forEach(group => {
        const newGroup = this.fb.group({
          tierIndex: [group.tierIndex, Validators.required],
          conditions: this.fb.array([], this.uniqueTargetEntityValidator())
        });

        const conditionsArray = newGroup.get('conditions') as FormArray;
        group.conditions.forEach(condition => {
          const targetEntity = condition.targetEntity;
          const targetEntityId = condition.targetEntityId;

          // Initialize options for this target entity type
          this.updateTargetEntityIdOptions(targetEntity);

          conditionsArray.push(this.fb.group({
            targetEntity: [targetEntity, Validators.required],
            targetEntityId: [targetEntityId || 0],
            shouldNotify: [condition.shouldNotify ?? false]
          }));
        });

        conditionGroupsArray.push(newGroup);
      });

      this.tierOptions.set([...this.tierOptions()]);
    }
  } catch (error) {
    console.error("Error loading discount:", error);
  }
}

  onSubmit(): void {
    this.removeUnusedTiers();

    this.conditionGroups.controls.forEach(group => {
      const conditions = group.get('conditions') as FormArray;
      conditions.updateValueAndValidity({ emitEvent: true });
    });

    if (this.discountInfoForm.invalid || this.tiersForm.invalid || this.discountGroupForm.invalid) {
      console.warn('Form invalid');
      return;
    }

    const discount: IDiscount = {
      ...this.discountInfoForm.value,
      tiers: this.tiersForm.value.tiers,
      discountGroup: {
        name: this.discountInfoForm.value.name + '_group',
        conditionGroups: this.discountGroupForm.value.conditionGroups
      }
    };

    if (this.isEditMode) {
      this.discountService.updateDiscount(discount).subscribe({
        next: () => {
          this.notificationService.showSuccess('Discount updated successfully');
        },
        error: err => {
          this.notificationService.showError('Failed to update discount');
          console.error('Error updating discount:', err);}
      });
    } else {
      this.discountService.createDiscount(discount).subscribe({
        next: () => {
          this.notificationService.showSuccess('Discount created successfully');
          console.log('Create Discount', discount);
        },
        error: (err) => {
          this.notificationService.showError('Failed to create discount');
          console.error('Error creating discount:', err);
        }
      });
    }
  }

  onAddTier(): void {
    this.tiers.push(this.fb.group({
      amount        : [10],
      isPercentage  : [true],
      isFreeShipping: [false]
    }, { validators: this.amountValidator() }));

    this.updateTierOptions();
  }

  onRemoveTier(i: number): void {
    this.tiers.removeAt(i);
    this.updateTierOptions();
  }

  onAddConditionGroup(): void {
    this.conditionGroups.push(this.fb.group({
      tierIndex : [0, Validators.required],
      conditions: this.fb.array([], this.uniqueTargetEntityValidator())
    }));
  }

  onRemoveConditionGroup(i: number): void {
    this.conditionGroups.removeAt(i);
  }

  onBeforeNextStepFromTiersForm() {
    this.updateTierOptions();
  }

  onAddCondition(groupIndex: number): void {
    const conditions = this.getConditions(groupIndex);
    // List of all existing targetEntity values ​​in this group
    const usedEntities = conditions.controls.map(c => c.get('targetEntity')?.value);
    // Find the first unused DiscountTargetType
    const availableTarget = Object.values(DiscountTargetType).find(
      target => !usedEntities.includes(target)
    );
    if (!availableTarget) {
      console.warn('All available conditions have already been added.');
      return;
    }

    conditions.push(this.fb.group({
      targetEntity  : [availableTarget, Validators.required],
      targetEntityId: [null],
      shouldNotify  : [false]
    }));
  }

  onRemoveCondition(groupIndex: number, conditionIndex: number): void {
    this.getConditions(groupIndex).removeAt(conditionIndex);
  }

  onTargetEntityChange(i: number, j: number) {
    const control          = this.getConditions(i).at(j);
    const targetEntityType = control.get('targetEntity')?.value as DiscountTargetType;
    const options          = this.updateTargetEntityIdOptions(targetEntityType);

    if (options.length == 0) {
      control.get('targetEntityId')?.setValue(0);
    }
  }

  private updateTierOptions(): void {
    const updatedTiers = this.tiers.controls.map((tier, index) => {
      const amount         = tier.get('amount')?.value;
      const isPercentage   = tier.get('isPercentage')?.value;
      const isFreeShipping = tier.get('isFreeShipping')?.value;

      let label = `${amount}${isPercentage ? '%' : '€'}`;
      if (isFreeShipping) label += ' + Free shipping';

      return {
        label,
        value: index
      };
    });

    this.tierOptions.set(updatedTiers);
  }

  updateTargetEntityIdOptions(targetEntityType: DiscountTargetType): ITargetEntityOption[] {
    let options: ITargetEntityOption[] = [];

    if (!this.targetEntityIdOptionsMap.has(targetEntityType)) {
      if (targetEntityType === DiscountTargetType.ProductBrand) {
        options = this.brands.map(b => ({ label: b.name, value: b.id }));
      } else if (targetEntityType === DiscountTargetType.ProductType) {
        options = this.types.map(t => ({ label: t.name, value: t.id }));
      }
      else {
        options = [];
      }

      this.targetEntityIdOptionsMap.set(targetEntityType, options);
    }

    return options;
  }

  private removeUnusedTiers(): void {
    const usedTierIndices = new Set<number>();
    const currentTierCount = this.tiers.length;

    // 1. Identify used tiers from condition groups
    this.conditionGroups.controls.forEach(group => {
      const tierIndex = group.get('tierIndex')?.value;
      if (typeof tierIndex === 'number' && tierIndex >= 0 && tierIndex < currentTierCount) {
        usedTierIndices.add(tierIndex);
      }
    });

    // 2. Create old > new index mapping for remaining tiers
    const sortedUsedIndices = Array.from(usedTierIndices).sort((a, b) => a - b);
    const indexMap = new Map(sortedUsedIndices.map((oldIndex, newIndex) => [oldIndex, newIndex]));

    // 3. Filter and keep only used tiers (maintain original order)
    const tiersToKeep = this.tiers.controls.filter((_, index) => usedTierIndices.has(index));

    // 4. Replace tiers array
    this.tiers.clear();
    tiersToKeep.forEach(tier => this.tiers.push(tier));

    // 5. Update condition groups with new tier indices
    this.conditionGroups.controls.forEach(group => {
      const oldIndex = group.get('tierIndex')?.value;
      if (typeof oldIndex === 'number' && indexMap.has(oldIndex)) {
        group.get('tierIndex')?.setValue(indexMap.get(oldIndex));
      }
    });

    this.updateTierOptions();
  }

  private amountValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const amount = group.get('amount')?.value;
      const isPercentage = group.get('isPercentage')?.value;

      if (amount <= 0) {
        return { amountTooLow: true };
      }

      if (isPercentage && amount >= 100) {
        return { percentageTooHigh: true };
      }

      return null;
    };
  }

  private uniqueTargetEntityValidator(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      if (!(formArray instanceof FormArray)) {
        return null;
      }

      const values = formArray.controls.map(c => c.get('targetEntity')?.value);
      const hasDuplicates = new Set(values).size !== values.length;
      return hasDuplicates ? { duplicateTargetEntity: true } : null;
    };
  }

  private uniqueBrandTypePairValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const conditionGroups = control as FormArray;

      // Track coverage in all forms
      const allBrandsForType   = new Map<number, number>();  // Type -> "All Brands" group
      const allTypesForBrand   = new Map<number, number>();  // Brand -> "All Types" group
      const specificBrandTypes = new Map<string, number>();  // "brand-type" -> group

      let   universalGroupIndex: number | null = null;       // Tracks universal discount group

      const partialAllGroups = {
        allBrands: new Set<number>(),
        allTypes : new Set<number>()
      };

      for (let groupIndex = 0; groupIndex < conditionGroups.length; groupIndex++) {
        const group      = conditionGroups.at(groupIndex) as FormGroup;
        const conditions = group.get('conditions') as FormArray;

        let brandId: number | null = null;
        let typeId: number | null  = null;
        let hasAllCondition        = false;
        let hasAllBrand            = false;
        let hasAllType             = false;

        // Parse conditions
        for (let conditionIndex = 0; conditionIndex < conditions.length; conditionIndex++) {
          const condition      = conditions.at(conditionIndex) as FormGroup;
          const targetEntity   = condition.get('targetEntity')?.value;
          const targetEntityId = condition.get('targetEntityId')?.value;

          if (targetEntity === DiscountTargetType.All) {
            hasAllCondition = true;
          } else if (targetEntity === DiscountTargetType.ProductBrand) {
            brandId = targetEntityId;
            if (targetEntityId === 0) hasAllBrand = true;
          } else if (targetEntity === DiscountTargetType.ProductType) {
            typeId = targetEntityId;
            if (targetEntityId === 0) hasAllType = true;
          }
        }

        // Validate condition pairing
        if (!hasAllCondition) {
          if ((brandId === null && typeId !== null) ||
            (brandId !== null && typeId === null)) {
            return {
              duplicateBrandTypePair: {
                message: 'Must specify both Brand and Type unless using "All"',
                groups : [groupIndex]
              }
            };
          }
        }

        // Handle universal cases (All products)
        if (hasAllCondition || (hasAllBrand && hasAllType)) {
          brandId = 0;
          typeId  = 0;
        }

        // Case 4: Universal discount (All products)
        if (brandId === 0 && typeId === 0) {
          if (universalGroupIndex !== null) {
            return {
              duplicateBrandTypePair: {
                message: 'Only one universal discount group allowed',
                groups : [universalGroupIndex, groupIndex]
              }
            };
          }
          if (allBrandsForType.size > 0 || allTypesForBrand.size > 0 || specificBrandTypes.size > 0) {
            return {
              duplicateBrandTypePair: {
                message: 'Universal discount cannot coexist with specific rules',
                groups : [groupIndex]
              }
            };
          }

          universalGroupIndex = groupIndex;

          continue;
        }

        // Validate partial "All" conditions
        if ((brandId === 0 && (typeId === null || typeId === 0)) ||
          (typeId === 0 && (brandId === null || brandId === 0))) {
          return {
            duplicateBrandTypePair: {
              message: 'When using "All" for Brand/Type, you must specify the other',
              groups : [groupIndex]
            }
          };
        }
        // Check for conflicting partial "All" groups
        if (brandId === 0) {
          partialAllGroups.allBrands.add(typeId!);
        }
        if (typeId === 0) {
          partialAllGroups.allTypes.add(brandId!);
        }

        // Block specific rules if universal exists
        if (universalGroupIndex !== null) {
          return {
            duplicateBrandTypePair: {
              message: 'Cannot add specific rules after universal discount',
              groups : [universalGroupIndex, groupIndex]
            }
          };
        }

        // Original validation logic for non-universal cases
        if (brandId !== null && typeId !== null) {
          // Case 1: All Brands with specific type
          if (brandId === 0 && typeId !== 0) {
            const conflictingGroups = Array.from(specificBrandTypes.entries())
              .filter(([key]) => key.endsWith(`-${typeId}`))
              .map(([, groupIdx]) => groupIdx);

            if (conflictingGroups.length > 0) {
              return {
                duplicateBrandTypePair: {
                  message: 'All brands coverage makes specific brand rules redundant for this type',
                  groups : [conflictingGroups[0], groupIndex]
                }
              };
            }

            if (allBrandsForType.has(typeId)) {
              return {
                duplicateBrandTypePair: {
                  message: 'Type already covered by all brands',
                  groups : [allBrandsForType.get(typeId)!, groupIndex]
                }
              };
            }

            allBrandsForType.set(typeId, groupIndex);
          }
          // Case 2: All Types with specific brand
          else if (typeId === 0 && brandId !== 0) {
            const conflictingGroups = Array.from(specificBrandTypes.entries())
              .filter(([key]) => key.startsWith(`${brandId}-`))
              .map(([, groupIdx]) => groupIdx);

            if (conflictingGroups.length > 0) {
              return {
                duplicateBrandTypePair: {
                  message: 'All types coverage makes specific type rules redundant for this brand',
                  groups : [conflictingGroups[0], groupIndex]
                }
              };
            }

            if (allTypesForBrand.has(brandId)) {
              return {
                duplicateBrandTypePair: {
                  message: 'Brand already has all types coverage',
                  groups : [allTypesForBrand.get(brandId)!, groupIndex]
                }
              };
            }

            allTypesForBrand.set(brandId, groupIndex);
          }
          // Case 3: Specific brand + type
          else if (brandId !== 0 && typeId !== 0) {
            if (allBrandsForType.has(typeId)) {
              return {
                duplicateBrandTypePair: {
                  message: 'Specific brand covered by all brands rule for this type',
                  groups : [allBrandsForType.get(typeId)!, groupIndex]
                }
              };
            }

            if (allTypesForBrand.has(brandId)) {
              return {
                duplicateBrandTypePair: {
                  message: 'Specific type covered by all types rule for this brand',
                  groups : [allTypesForBrand.get(brandId)!, groupIndex]
                }
              };
            }

            const pairKey = `${brandId}-${typeId}`;
            if (specificBrandTypes.has(pairKey)) {
              return {
                duplicateBrandTypePair: {
                  message: 'Duplicate brand/type combination',
                  groups : [specificBrandTypes.get(pairKey)!, groupIndex]
                }
              };
            }

            specificBrandTypes.set(pairKey, groupIndex);
          }
        }
      }

      // Check for cross-group "All" conflicts
      const hasOverlappingAll =
        partialAllGroups.allBrands.size > 0 &&
        partialAllGroups.allTypes.size > 0;

      if (hasOverlappingAll) {
        return {
          duplicateBrandTypePair: {
            message: 'Combination of "All Brands" and "All Types" groups creates ambiguity',
            groups : Array.from(partialAllGroups.allBrands).concat(Array.from(partialAllGroups.allTypes))
          }
        };
      }

      return null;
    };
  }

  private formatDate(date: Date): string {
    const day   = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-based
    const year  = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
  private formatDateForInput(date: Date): string {
    const day   = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year  = date.getFullYear();
    return `${year}-${month}-${day}`; // Format for <input type="date">
 }
 handleApiError(error: any): void {
    console.error(error);
 }
}
