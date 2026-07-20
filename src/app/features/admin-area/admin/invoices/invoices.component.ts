import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, signal, viewChild, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { InvoiceService } from 'src/app/core/services/invoice.service';
import { IInvoiceSummary } from 'src/app/shared/models/invoice';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
  selector: 'app-admin-invoices',
  templateUrl: './invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslatePipe, RouterModule, DatePipe, DecimalPipe, UpperCasePipe, MatPaginatorModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatTableModule, MatIconModule]
})
export class InvoicesComponent implements AfterViewInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  paginator = viewChild.required<MatPaginator>(MatPaginator);

  invoices   = signal<IInvoiceSummary[]>([]);
  totalCount = signal<number>(0);

  private pageIndex = 1;
  private pageSize = 10;
  private search = '';

  columnsToDisplay: string[] = ['invoiceNumber', 'issueDate', 'buyerEmail', 'totalGross', 'orderId', 'Action'];

  private unsubscribe$ = new Subject<void>();
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  ngAfterViewInit(): void {
    this.loadData();
    this.paginator().page.pipe(takeUntil(this.unsubscribe$)).subscribe((e: PageEvent) => {
      this.pageIndex = e.pageIndex + 1;
      this.pageSize = e.pageSize;
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadData(): void {
    this.invoiceService.getInvoices(this.pageIndex, this.pageSize, this.search || undefined)
      .subscribe((response) => {
        this.invoices.set(response.data);
        this.totalCount.set(response.count);
      });
  }

  applySearch(term: string): void {
    this.search = term.trim();
    this.pageIndex = 1;
    this.paginator().firstPage();
    this.loadData();
  }

  viewInvoice(id: number): void {
    this.router.navigateByUrl(`/admin/invoices/${id}`);
  }

  protected columnLabel(column: string): string {
    const labels: Record<string, string> = {
      invoiceNumber: TranslationKeys.Admin.Invoices.Number,
      issueDate: TranslationKeys.Admin.Invoices.IssueDate,
      buyerEmail: TranslationKeys.Admin.Invoices.Buyer,
      totalGross: TranslationKeys.Admin.Invoices.Total,
      orderId: TranslationKeys.Admin.Invoices.Order,
      Action: TranslationKeys.Admin.Common.Actions
    };
    return labels[column] ?? column;
  }
}
