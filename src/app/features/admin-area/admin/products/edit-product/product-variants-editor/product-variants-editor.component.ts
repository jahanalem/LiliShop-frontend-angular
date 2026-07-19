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
import { IProductVariant, IVariantAttributeSelection, IVariantGenerationRequest, IVariantUpsertRow } from 'src/app/shared/models/productVariant';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { VariantStockDialogComponent, VariantStockDialogData } from '../variant-stock-dialog/variant-stock-dialog.component';

/**
 * One editable variant row. Which attributes DEFINE a variant is chosen per product (see
 * `definingAttributeIds`), not from the attribute's global input type — so Color can be a defining
 * axis for a colour-variant tee while staying descriptive for a striped shirt. `selections` holds
 * the chosen value ids per attribute (one for a defining axis, several for a descriptive facet);
 * links whose attribute is inactive/unknown are preserved untouched on save.
 */
interface VariantRow {
  id: number;
  sku: string;
  price: number;
  quantityOnHand: number;
  isActive: boolean;
  position: number;
  /** attributeId → chosen value ids (defining attributes use only the first). */
  selections: Record<number, number[]>;
  preserved: IVariantAttributeSelection[];
  /** Transient UI flag: this row is picked for a bulk operation. Never sent to the server. */
  selected: boolean;
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

  /** Every active attribute (with at least one active value) available in this editor. */
  readonly attributes = signal<IProductAttribute[]>([]);

  /** Per-PRODUCT choice: which attributes identify a variant. Everything else is descriptive. */
  readonly definingAttributeIds = signal<Set<number>>(new Set());

  readonly definingAttributes = computed<IProductAttribute[]>(() =>
    this.attributes().filter(a => this.definingAttributeIds().has(a.id)));

  readonly descriptiveAttributes = computed<IProductAttribute[]>(() =>
    this.attributes().filter(a => !this.definingAttributeIds().has(a.id)));

  /** Generator state: defining attribute id → value ids picked for combination generation. */
  generatorSelections: Record<number, number[]> = {};

  /** Optional SKU template for generation, e.g. "SHIRT-{PATTERN}-{SIZE}". */
  generatorSkuPattern = '';

  /** Bulk-edit inputs applied to the currently selected rows. */
  bulkPrice: number | null = null;
  bulkStock: number | null = null;

  private readonly variantService = inject(ProductVariantService);
  private readonly attributeService = inject(ProductAttributeService);
  private readonly notificationService = inject(NotificationService);
  private readonly translationService = inject(TranslationService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.attributeService.getAllAttributes(true).subscribe({
      next: (allAttributes) => {
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
        this.definingAttributeIds.set(this.deriveDefiningAttributeIds(variants));
        this.rows.set(variants.map(v => this.toRow(v)));
        this.dirty.set(false);
      },
      error: (error) => console.error(error)
    });
  }

  /**
   * The product's defining attributes: those already marked defining on existing variants;
   * for a product with no defining links yet, default to the Select-type attributes so a fresh
   * product gets sensible single-value axes out of the box.
   */
  private deriveDefiningAttributeIds(variants: IProductVariant[]): Set<number> {
    const known = new Set(this.attributes().map(a => a.id));
    const defining = new Set<number>();
    for (const variant of variants) {
      for (const link of variant.attributeValues) {
        if (link.isDefining && known.has(link.productAttributeId)) {
          defining.add(link.productAttributeId);
        }
      }
    }
    if (defining.size === 0) {
      for (const attribute of this.attributes()) {
        if (attribute.inputType === 'Select') {
          defining.add(attribute.id);
        }
      }
    }
    return defining;
  }

  isDefiningAttribute(attributeId: number): boolean {
    return this.definingAttributeIds().has(attributeId);
  }

  toggleDefiningAttribute(attributeId: number): void {
    const next = new Set(this.definingAttributeIds());
    if (next.has(attributeId)) {
      next.delete(attributeId);
    } else {
      next.add(attributeId);
      // A defining axis carries a single value — trim any multi-selection down to the first.
      this.rows.update(rows => rows.map(row => {
        const values = row.selections[attributeId];
        return values && values.length > 1
          ? { ...row, selections: { ...row.selections, [attributeId]: [values[0]] } }
          : row;
      }));
    }
    this.definingAttributeIds.set(next);
    this.dirty.set(true);
  }

  private toRow(variant: IProductVariant): VariantRow {
    const known = new Set(this.attributes().map(a => a.id));
    const selections: Record<number, number[]> = {};
    const preserved: IVariantAttributeSelection[] = [];

    for (const link of variant.attributeValues) {
      if (known.has(link.productAttributeId)) {
        (selections[link.productAttributeId] ??= []).push(link.productAttributeValueId);
      } else {
        // Link of an inactive/unknown attribute — round-trip it untouched (defining-ness kept).
        preserved.push({ attributeId: link.productAttributeId, valueId: link.productAttributeValueId });
      }
    }

    return {
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      quantityOnHand: variant.inventory?.quantityOnHand ?? 0,
      isActive: variant.isActive,
      position: variant.position,
      selections,
      preserved,
      selected: false
    };
  }

  /**
   * Shared, stable empty selection. A descriptive `mat-select multiple` binds its `[ngModel]` to
   * `multiValue(...)`, which runs on every change-detection pass. Returning a fresh `[]` here would
   * hand the value accessor a NEW array reference each pass; NgModel would treat that as a change,
   * write it back to the control, MatSelect would `markForCheck()`, and — under zoneless change
   * detection — that schedules yet another pass, looping forever (NG0103 / "page unresponsive").
   * A single shared instance keeps the reference identical across passes, so the loop never starts.
   * (MatSelect only reads this array to resolve the selection; it never mutates it, so sharing one
   * instance across every unset multi-select is safe.)
   */
  private static readonly NO_SELECTION: number[] = [];

  singleValue(row: VariantRow, attributeId: number): number | null {
    return row.selections[attributeId]?.[0] ?? null;
  }

  multiValue(row: VariantRow, attributeId: number): number[] {
    return row.selections[attributeId] ?? ProductVariantsEditorComponent.NO_SELECTION;
  }

  updateRow(index: number, patch: Partial<VariantRow>): void {
    this.rows.update(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
    this.dirty.set(true);
  }

  setSingleValue(index: number, attributeId: number, valueId: number | null): void {
    this.setSelection(index, attributeId, valueId == null ? [] : [valueId]);
  }

  setMultiValue(index: number, attributeId: number, valueIds: number[]): void {
    this.setSelection(index, attributeId, valueIds);
  }

  private setSelection(index: number, attributeId: number, valueIds: number[]): void {
    this.rows.update(rows => rows.map((row, i) => i === index
      ? { ...row, selections: { ...row.selections, [attributeId]: valueIds } }
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
      selections: {},
      preserved: [],
      selected: false
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
   * Generate-then-review: the SERVER expands the cartesian product of the picked defining-axis
   * values, skips combinations already saved on the product, and renders SKUs from the pattern.
   * The returned drafts are appended as editable rows (nothing is persisted until Save). Drafts
   * whose defining combination already matches an UNSAVED row in the editor are skipped too, so
   * repeated generations never duplicate a pending row.
   */
  generateCombinations(): void {
    const axes = this.definingAttributes()
      .map(attribute => ({ attributeId: attribute.id, valueIds: this.generatorSelections[attribute.id] ?? [] }))
      .filter(group => group.valueIds.length > 0);
    if (axes.length === 0) {
      return;
    }

    const request: IVariantGenerationRequest = {
      axes,
      skuPattern: this.generatorSkuPattern.trim() || null
    };

    this.variantService.generateVariants(this.productId(), request).subscribe({
      next: (drafts) => this.appendDrafts(drafts),
      error: (error) => {
        console.error(error);
        this.errorMessage.set(error?.error?.message
          ?? this.translationService.translate(TranslationKeys.Admin.Products.GenerateFailed));
      }
    });
  }

  private appendDrafts(drafts: IVariantUpsertRow[]): void {
    const existingSignatures = new Set(this.rows().map(row => this.signatureOf(row)));
    const newRows: VariantRow[] = [];

    for (const draft of drafts) {
      const row = this.draftToRow(draft);
      const signature = this.signatureOf(row);
      if (existingSignatures.has(signature)) {
        continue;
      }
      existingSignatures.add(signature);
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
    this.generatorSkuPattern = '';
  }

  /** Turns a server DRAFT row into an editable in-memory row (always a new, unsaved row). */
  private draftToRow(draft: IVariantUpsertRow): VariantRow {
    const known = new Set(this.attributes().map(a => a.id));
    const selections: Record<number, number[]> = {};
    const preserved: IVariantAttributeSelection[] = [];

    for (const selection of [...draft.axisValues, ...(draft.descriptiveValues ?? [])]) {
      if (known.has(selection.attributeId)) {
        (selections[selection.attributeId] ??= []).push(selection.valueId);
      } else {
        preserved.push(selection);
      }
    }

    return {
      id: 0,
      sku: draft.sku ?? '',
      price: draft.price,
      quantityOnHand: draft.quantityOnHand,
      isActive: draft.isActive,
      position: draft.position,
      selections,
      preserved,
      selected: false
    };
  }

  // --- Bulk edit ----------------------------------------------------------

  readonly selectedCount = computed(() => this.rows().filter(r => r.selected).length);

  readonly allSelected = computed(() => this.rows().length > 0 && this.rows().every(r => r.selected));

  toggleRowSelected(index: number, selected: boolean): void {
    this.rows.update(rows => rows.map((row, i) => i === index ? { ...row, selected } : row));
  }

  toggleSelectAll(selected: boolean): void {
    this.rows.update(rows => rows.map(row => ({ ...row, selected })));
  }

  /** Sets the given price on every selected row (drafts and saved rows alike). */
  applyBulkPrice(): void {
    if (this.bulkPrice === null || this.selectedCount() === 0) {
      return;
    }
    const price = this.bulkPrice;
    this.rows.update(rows => rows.map(row => row.selected ? { ...row, price } : row));
    this.dirty.set(true);
  }

  /**
   * Sets initial stock on selected DRAFT rows only. Saved variants must move stock through the
   * ledger (adjustment dialog), so they are left untouched.
   */
  applyBulkStock(): void {
    if (this.bulkStock === null || this.selectedCount() === 0) {
      return;
    }
    const quantityOnHand = this.bulkStock;
    this.rows.update(rows => rows.map(row =>
      row.selected && row.id === 0 ? { ...row, quantityOnHand } : row));
    this.dirty.set(true);
  }

  setSelectedActive(isActive: boolean): void {
    if (this.selectedCount() === 0) {
      return;
    }
    this.rows.update(rows => rows.map(row => row.selected ? { ...row, isActive } : row));
    this.dirty.set(true);
  }

  /** Defining signature of a row (matches the backend's AxisSignature): sorted attr:value of defining axes. */
  private signatureOf(row: VariantRow): string {
    const definingIds = this.definingAttributeIds();
    const pairs: [number, number][] = [];
    for (const [attrId, values] of Object.entries(row.selections)) {
      if (definingIds.has(Number(attrId)) && values.length > 0) {
        pairs.push([Number(attrId), values[0]]);
      }
    }
    for (const p of row.preserved) {
      pairs.push([p.attributeId, p.valueId]);
    }
    return pairs
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .map(([attributeId, valueId]) => `${attributeId}:${valueId}`)
      .join('|');
  }

  // --- Save ----------------------------------------------------------------

  save(): void {
    this.errorMessage.set('');
    const definingIds = this.definingAttributeIds();

    const payload: IVariantUpsertRow[] = this.rows().map(row => {
      const axisValues: IVariantAttributeSelection[] = [...row.preserved];
      const descriptiveValues: IVariantAttributeSelection[] = [];

      for (const [attrIdStr, valueIds] of Object.entries(row.selections)) {
        const attributeId = Number(attrIdStr);
        if (valueIds.length === 0) {
          continue;
        }
        if (definingIds.has(attributeId)) {
          axisValues.push({ attributeId, valueId: valueIds[0] }); // defining = single value
        } else {
          for (const valueId of valueIds) {
            descriptiveValues.push({ attributeId, valueId });
          }
        }
      }

      return {
        id: row.id,
        sku: row.sku?.trim() ? row.sku.trim() : null,
        price: row.price,
        isActive: row.isActive,
        position: row.position,
        // Only meaningful for new rows (initial stock); the backend ignores it for existing ones.
        quantityOnHand: row.quantityOnHand,
        axisValues,
        descriptiveValues
      };
    });

    this.variantService.saveVariants(this.productId(), payload).subscribe({
      next: (variants) => {
        this.definingAttributeIds.set(this.deriveDefiningAttributeIds(variants));
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
