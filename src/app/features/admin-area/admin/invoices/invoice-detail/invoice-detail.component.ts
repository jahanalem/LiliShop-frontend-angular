import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { InvoiceService } from 'src/app/core/services/invoice.service';
import { IInvoice } from 'src/app/shared/models/invoice';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
  selector: 'app-admin-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslatePipe, RouterModule, DatePipe, DecimalPipe, UpperCasePipe,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule]
})
export class InvoiceDetailComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  invoice = signal<IInvoice | undefined>(undefined);
  columnsToDisplay: string[] = ['position', 'productName', 'quantity', 'lineTotalGross'];

  private invoiceService = inject(InvoiceService);
  private activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.invoiceService.getInvoiceById(+id).subscribe({
      next: (invoice) => this.invoice.set(invoice),
      error: (err) => console.log(err)
    });
  }

  downloadPdf(): void {
    const inv = this.invoice();
    if (!inv) {
      return;
    }
    this.invoiceService.getAdminInvoicePdf(inv.id).subscribe({
      next: (blob) => this.invoiceService.savePdf(blob, inv.invoiceNumber),
      error: (err) => console.log(err)
    });
  }
}
