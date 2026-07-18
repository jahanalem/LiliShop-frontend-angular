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
import { IProductAttribute } from 'src/app/shared/models/productAttribute';
import { IProductVariant, IVariantAttributeSelection, IVariantUpsertRow } from 'src/app/shared/models/productVariant';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { VariantStockDialogComponent, VariantStockDialogData } from '../variant-stock-dialog/variant-stock-dialog.component';

/**
 * One editable variant row. Select-type attributes are DEFINING axes (one value each,
 * identity-forming); MultiSelect attributes are DESCRIPTIVE (several values, e.g. the colors of a
 * striped shirt). Links whose attribute is inactive/unknown are preserved untouched on save.
 */
interface VariantRow {
  id: number;
  sku: string;
  price: number;
  quantityOnHand: number;
  isActive: boolean;
  position: number;
  /** Select-attribute id → chosen value id (defining). */
  axisSelections: Record<number, number | null>;
  /** MultiSelect-attribute id → chosen value ids (descriptive). */
  descriptiveSelections: Record<number, number[]>;
  preservedAxes: IVariantAttributeSelection[];
  preservedDescriptive: IVariantAttributeSelection[];
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
  readonly generatorOpen = signal<boolean>(false);

  private readonly attributes = signal<IProductAttribute[]>([]);

  /** Defining axes offered in each row: every active Select attribute with active values. */
  readonly axisAttributes = computed<IProductAttribute[]>(() =>
    this.attributes().filter(a => a.inputType === 'Select'));

  /** Descriptive facets offered in each row: every active MultiSelect attribute. */
  readonly descriptiveAttributes = computed<IProductAttribute[]>(() =>
    this.attributes().filter(a => a.inputType === 'MultiSelect'));

  /** Generator state: axis attribute id → value ids picked for combination generation. */
  generatorSelections: Record<number, number[]> = {};

  private readonly variantService = inject(ProductVariantService);
  private readonly attributeService = inject(ProductAttributeService);
  private readonly notificationService = inject(NotificationService);
  private readonly translationService = inject(TranslationService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.attributeService.getAllAttributes(true).subscribe({
      next: (allAttributes) => {
        // All ACTIVE attributes with at least one active value participate in the editor.
        this.attributes.set(allAttributes
          .filter(a => (a.values?.filter(v => v.isActive).length ?? 0) > 0)
          .map(a => ({ ...a, values: a.values!.filter(v => v.isActive) })));
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
    const axisAttributeIds = new Set(this.axisAttributes().map(a => a.id));
    const descriptiveAttributeIds = new Set(this.descriptiveAttributes().map(a => a.id));

    const axisSelections: Record<number, number | null> = {};
    const descriptiveSelections: Record<number, number[]> = {};
    const preservedAxes: IVariantAttributeSelection[] = [];
    const preservedDescriptive: IVariantAttributeSelection[] = [];

    for (const link of variant.attributeValues) {
      const selection = { attributeId: link.productAttributeId, valueId: link.productAttributeValueId };
      if (link.isDefining) {
        if (axisAttributeIds.has(link.productAttributeId)) {
          axisSelections[link.productAttributeId] = link.productAttributeValueId;
        } else {
          preservedAxes.push(selection); // defining link of an inactive/non-Select attribute
        }
      } else {
        if (descriptiveAttributeIds.has(link.productAttributeId)) {
          (descriptiveSelections[link.productAttributeId] ??= []).push(link.productAttributeValueId);
        } else {
          preservedDescriptive.push(selection);
        }
      }
    }

    return {
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      quantityOnHand: variant.inventory?.quantityOnHand ?? 0,
      isActive: variant.isActive,
      position: variant.position,
      axisSelections,
      descriptiveSelections,
      preservedAxes,
      preservedDescriptive
    };
  }

  updateRow(index: number, patch: Partial<VariantRow>): void {
    this.rows.update(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
    this.dirty.set(true);
  }

  setAxisValue(index: number, attributeId: number, valueId: number | null): void {
    this.rows.update(rows => rows.map((row, i) => i === index
      ? { ...row, axisSelections: { ...row.axisSelections, [attributeId]: valueId } }
      : row));
    this.dirty.set(true);
  }

  setDescriptiveValues(index: number, attributeId: number, valueIds: number[]): void {
    this.rows.update(rows => rows.map((row, i) => i === index
      ? { ...row, descriptiveSelections: { ...row.descriptiveSelections, [attributeId]: valueIds } }
      : row));
    this.dirty.set(true);
  }

  addRow(): void {
    this.rows.update(rows => [...rows, this.createEmptyRow(rows)]);
    this.dirty.set(true);
  }

  private createEmptyRow(rows: VariantRow[]): VariantRow {
    return {
      id: 0,
      sku: '',
      price: this.defaultPrice(),
      quantityOnHand: 0,
      isActive: true,
      position: (Math.max(0, ...rows.map(r => r.position)) + 10),
      axisSelections: {},
      descriptiveSelections: {},
      preservedAxes: [],
      preservedDescriptive: []
    };
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

  /** Stock of a saved variant changes only through the ledger dialog (delta + reason). */
  openStockDialog(index: number): void {
    const row = this.rows()[index];
    if (!row || row.id === 0) {
      return;
    }

    const data: VariantStockDialogData = {
      variantId: row.id,
      sku: row.sku,
      quantityOnHand: row.quantityOnHand
    };
    this.dialog.open<VariantStockDialogComponent, VariantStockDialogData, number>(VariantStockDialogComponent, { data })
      .afterClosed()
      .subscribe({
        next: (newQuantity?: number) => {
          if (newQuantity !== undefined) {
            // Server-confirmed value; not a form edit, so the dirty flag stays untouched.
            this.rows.update(rows => rows.map((r, i) => i === index ? { ...r, quantityOnHand: newQuantity } : r));
          }
        },
        error: (error) => console.error(error)
      });
  }

  // --- Bulk generation ----------------------------------------------------

  toggleGenerator(): void {
    this.generatorOpen.update(open => !open);
  }

  get canGenerate(): boolean {
    return Object.values(this.generatorSelections).some(ids => ids?.length > 0);
  }

  /**
   * Cartesian product of the picked values per axis, minus combinations already present.
   * Rows arrive as drafts (blank SKU = server auto-generates); the batch save validates
   * uniqueness server-side.
   */
  generateCombinations(): void {
    const groups = this.axisAttributes()
      .map(attribute => ({ attributeId: attribute.id, valueIds: this.generatorSelections[attribute.id] ?? [] }))
      .filter(group => group.valueIds.length > 0);
    if (groups.length === 0) {
      return;
    }

    let combos: Record<number, number>[] = [{}];
    for (const group of groups) {
      combos = combos.flatMap(combo => group.valueIds.map(valueId => ({ ...combo, [group.attributeId]: valueId })));
    }

    const existingSignatures = new Set(this.rows().map(row => this.signatureOf(row.axisSelections, row.preservedAxes)));
    const newRows: VariantRow[] = [];
    let currentRows = this.rows();

    for (const combo of combos) {
      const signature = this.signatureOf(combo, []);
      if (existingSignatures.has(signature)) {
        continue;
      }
      existingSignatures.add(signature);
      const row = this.createEmptyRow([...currentRows, ...newRows]);
      row.axisSelections = combo;
      newRows.push(row);
    }

    if (newRows.length === 0) {
      this.notificationService.showSuccess(
        this.translationService.translate(TranslationKeys.Admin.Products.NoNewCombinations));
      return;
    }

    this.rows.update(rows => [...rows, ...newRows]);
    this.dirty.set(true);
    this.generatorOpen.set(false);
    this.generatorSelections = {};
  }

  private signatureOf(axisSelections: Record<number, number | null>, preserved: IVariantAttributeSelection[]): string {
    const pairs = Object.entries(axisSelections)
      .filter(([, valueId]) => valueId != null)
      .map(([attributeId, valueId]) => [Number(attributeId), valueId as number] as const)
      .concat(preserved.map(p => [p.attributeId, p.valueId] as const));
    return pairs
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .map(([attributeId, valueId]) => `${attributeId}:${valueId}`)
      .join('|');
  }

  // --- Save ----------------------------------------------------------------

  save(): void {
    this.errorMessage.set('');

    const payload: IVariantUpsertRow[] = this.rows().map(row => ({
      id: row.id,
      sku: row.sku?.trim() ? row.sku.trim() : null,
      price: row.price,
      isActive: row.isActive,
      position: row.position,
      // Only meaningful for new rows (initial stock); the backend ignores it for existing ones.
      quantityOnHand: row.quantityOnHand,
      axisValues: [
        ...Object.entries(row.axisSelections)
          .filter(([, valueId]) => valueId != null)
          .map(([attributeId, valueId]) => ({ attributeId: Number(attributeId), valueId: valueId as number })),
        ...row.preservedAxes
      ],
      descriptiveValues: [
        ...Object.entries(row.descriptiveSelections)
          .flatMap(([attributeId, valueIds]) => valueIds.map(valueId => ({ attributeId: Number(attributeId), valueId }))),
        ...row.preservedDescriptive
      ]
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
