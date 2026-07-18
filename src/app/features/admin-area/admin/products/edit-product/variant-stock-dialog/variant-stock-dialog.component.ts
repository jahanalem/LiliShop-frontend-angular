import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { IInventoryTransaction, InventoryService } from 'src/app/core/services/inventory.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

export interface VariantStockDialogData {
  variantId: number;
  sku: string;
  quantityOnHand: number;
}

/**
 * Stock corrections go through here — a signed delta plus a mandatory reason, appended to the
 * inventory ledger server-side. The dialog also shows the variant's recent movement history.
 * Closes with the new on-hand quantity (or undefined when nothing changed).
 */
@Component({
  selector: 'app-variant-stock-dialog',
  templateUrl: './variant-stock-dialog.component.html',
  styleUrls: ['./variant-stock-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslatePipe, CommonModule, FormsModule, MatButtonModule, MatDialogModule,
    MatFormFieldModule, MatIconModule, MatInputModule]
})
export class VariantStockDialogComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  readonly data = inject<VariantStockDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<VariantStockDialogComponent>);
  private readonly inventoryService = inject(InventoryService);

  readonly quantityOnHand = signal<number>(0);
  readonly transactions = signal<IInventoryTransaction[]>([]);
  readonly totalTransactions = signal<number>(0);
  readonly errorMessage = signal<string>('');
  readonly saving = signal<boolean>(false);

  delta: number | null = null;
  reason = '';

  private changed = false;

  ngOnInit(): void {
    this.quantityOnHand.set(this.data.quantityOnHand);
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.inventoryService.getTransactions(this.data.variantId, 1, 10).subscribe({
      next: (page) => {
        this.transactions.set(page.data);
        this.totalTransactions.set(page.count);
      },
      error: (error) => console.error(error)
    });
  }

  get canApply(): boolean {
    return !this.saving() && !!this.delta && this.reason.trim().length > 0;
  }

  apply(): void {
    if (!this.canApply || this.delta === null) {
      return;
    }

    this.errorMessage.set('');
    this.saving.set(true);
    this.inventoryService.adjust(this.data.variantId, this.delta, this.reason.trim()).subscribe({
      next: (inventory) => {
        this.quantityOnHand.set(inventory.quantityOnHand);
        this.changed = true;
        this.delta = null;
        this.reason = '';
        this.saving.set(false);
        this.loadTransactions();
      },
      error: (error) => {
        console.error(error);
        this.saving.set(false);
        this.errorMessage.set(error?.error?.message ?? '');
      }
    });
  }

  close(): void {
    this.dialogRef.close(this.changed ? this.quantityOnHand() : undefined);
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      Receive: TranslationKeys.Admin.Inventory.TypeReceive,
      Adjust: TranslationKeys.Admin.Inventory.TypeAdjust,
      Reserve: TranslationKeys.Admin.Inventory.TypeReserve,
      ReleaseReservation: TranslationKeys.Admin.Inventory.TypeReleaseReservation,
      Deduct: TranslationKeys.Admin.Inventory.TypeDeduct,
      Refund: TranslationKeys.Admin.Inventory.TypeRefund
    };
    return labels[type] ?? type;
  }
}
