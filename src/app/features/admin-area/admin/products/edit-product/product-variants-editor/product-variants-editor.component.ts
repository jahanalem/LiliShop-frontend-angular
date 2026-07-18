import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ProductAttributeService } from 'src/app/core/services/product-attribute.service';
import { ProductVariantService } from 'src/app/core/services/product-variant.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { IProductAttribute, IProductAttributeValue } from 'src/app/shared/models/productAttribute';
import { IProductVariant, IVariantAttributeSelection, IVariantUpsertRow } from 'src/app/shared/models/productVariant';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

/**
 * One editable variant row. The M1 editor lets the admin manage the size axis, SKU, price,
 * stock, and active flag; axis values of OTHER attributes (added by later milestones' tooling)
 * are preserved untouched and shown as read-only chips.
 */
interface VariantRow {
  id: number;
  sku: string;
  price: number;
  quantityOnHand: number;
  isActive: boolean;
  position: number;
  sizeValueId: number | null;
  otherAxes: IVariantAttributeSelection[];
  otherAxisLabels: string[];
  descriptive: IVariantAttributeSelection[];
}

@Component({
  selector: 'app-product-variants-editor',
  templateUrl: './product-variants-editor.component.html',
  styleUrls: ['./product-variants-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslatePipe, FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule]
})
export class ProductVariantsEditorComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  /** Id of the (already saved) product whose variants are edited. */
  readonly productId = input.required<number>();
  /** Default price for newly added rows (the product's current price). */
  readonly defaultPrice = input<number>(0);

  readonly rows = signal<VariantRow[]>([]);
  readonly dirty = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  private readonly sizeAttribute = signal<IProductAttribute | null>(null);
  readonly sizeValues = computed<IProductAttributeValue[]>(() => this.sizeAttribute()?.values ?? []);

  private readonly variantService = inject(ProductVariantService);
  private readonly attributeService = inject(ProductAttributeService);
  private readonly notificationService = inject(NotificationService);
  private readonly translationService = inject(TranslationService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.attributeService.getAllAttributes(true).subscribe({
      next: (attributes) => {
        this.sizeAttribute.set(attributes.find(a => a.code === 'size') ?? null);
        this.loadVariants();
      },
      error: (error) => {
        console.error(error);
        this.loadVariants();
      }
    });
  }

  private loadVariants(): void {
    this.variantService.getVariants(this.productId()).subscribe({
      next: (variants) => {
        this.rows.set(variants.map(v => this.toRow(v)));
        this.dirty.set(false);
      },
      error: (error) => console.error(error)
    });
  }

  private toRow(variant: IProductVariant): VariantRow {
    const sizeAttributeId = this.sizeAttribute()?.id;
    const axes = variant.attributeValues.filter(l => l.isDefining);
    const sizeLink = axes.find(l => l.productAttributeId === sizeAttributeId) ?? null;
    const otherAxes = axes.filter(l => l !== sizeLink);

    return {
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      quantityOnHand: variant.inventory?.quantityOnHand ?? 0,
      isActive: variant.isActive,
      position: variant.position,
      sizeValueId: sizeLink?.productAttributeValueId ?? null,
      otherAxes: otherAxes.map(l => ({ attributeId: l.productAttributeId, valueId: l.productAttributeValueId })),
      otherAxisLabels: otherAxes.map(l =>
        `${l.productAttribute?.name ?? l.productAttributeId}: ${l.productAttributeValue?.name ?? l.productAttributeValueId}`),
      descriptive: variant.attributeValues
        .filter(l => !l.isDefining)
        .map(l => ({ attributeId: l.productAttributeId, valueId: l.productAttributeValueId }))
    };
  }

  /** Size options selectable in a row: its current one plus sizes not used by rows with the same other axes. */
  availableSizeValues(row: VariantRow): IProductAttributeValue[] {
    const usedElsewhere = new Set(this.rows()
      .filter(r => r !== row && JSON.stringify(r.otherAxes) === JSON.stringify(row.otherAxes))
      .map(r => r.sizeValueId)
      .filter((id): id is number => id !== null));
    return this.sizeValues().filter(v => v.id === row.sizeValueId || !usedElsewhere.has(v.id));
  }

  updateRow(index: number, patch: Partial<VariantRow>): void {
    this.rows.update(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
    this.dirty.set(true);
  }

  addRow(): void {
    const free = this.sizeValues().filter(v => !this.rows().some(r => r.sizeValueId === v.id && r.otherAxes.length === 0));
    this.rows.update(rows => [
      ...rows,
      {
        id: 0,
        sku: '',
        price: this.defaultPrice(),
        quantityOnHand: 0,
        isActive: true,
        position: (Math.max(0, ...rows.map(r => r.position)) + 10),
        sizeValueId: free[0]?.id ?? null,
        otherAxes: [],
        otherAxisLabels: [],
        descriptive: []
      }
    ]);
    this.dirty.set(true);
  }

  removeRow(index: number): void {
    const row = this.rows()[index];
    if (!row) {
      return;
    }

    if (row.id === 0) {
      this.rows.update(rows => rows.filter((_, i) => i !== index));
      return;
    }

    const dialogData: IDialogData = {
      title: this.translationService.translate(TranslationKeys.Admin.Common.DeleteTitle),
      content: this.translationService.translate(TranslationKeys.Admin.Common.DeleteContent),
      showConfirmationButtons: true
    };
    this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe({
        next: (confirmed?: boolean) => {
          if (!confirmed) {
            return;
          }
          this.variantService.deleteVariant(row.id).subscribe({
            next: () => this.rows.update(rows => rows.filter((_, i) => i !== index)),
            error: (error) => {
              console.error(error);
              this.errorMessage.set(error?.error?.message ?? 'Delete failed.');
            }
          });
        },
        error: (error) => console.error(error)
      });
  }

  save(): void {
    this.errorMessage.set('');
    const sizeAttributeId = this.sizeAttribute()?.id;

    const payload: IVariantUpsertRow[] = this.rows().map(row => ({
      id: row.id,
      sku: row.sku?.trim() ? row.sku.trim() : null,
      price: row.price,
      isActive: row.isActive,
      position: row.position,
      quantityOnHand: row.quantityOnHand,
      axisValues: [
        ...(row.sizeValueId && sizeAttributeId
          ? [{ attributeId: sizeAttributeId, valueId: row.sizeValueId }]
          : []),
        ...row.otherAxes
      ],
      descriptiveValues: row.descriptive
    }));

    this.variantService.saveVariants(this.productId(), payload).subscribe({
      next: (variants) => {
        this.rows.set(variants.map(v => this.toRow(v)));
        this.dirty.set(false);
        this.notificationService.showSuccess(
          this.translationService.translate(TranslationKeys.Admin.Products.VariantsSaved));
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set(error?.error?.message
          ?? this.translationService.translate(TranslationKeys.Admin.Products.VariantsSaveFailed));
      }
    });
  }
}
