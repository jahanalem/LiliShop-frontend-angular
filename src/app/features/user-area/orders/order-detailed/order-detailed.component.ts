import { OrderTotalsComponent } from 'src/app/shared/components/order-totals/order-totals.component';
import { BasketSummaryComponent } from 'src/app/shared/components/basket-summary/basket-summary.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

import { RouterModule } from '@angular/router';
import { BreadcrumbService } from 'xng-breadcrumb';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { IOrder } from 'src/app/shared/models/order';
import { IInvoice } from 'src/app/shared/models/invoice';
import { OrdersService } from 'src/app/core/services/orders.service';
import { InvoiceService } from 'src/app/core/services/invoice.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

@Component({
    selector: 'app-order-detailed',
    templateUrl: './order-detailed.component.html',
    styleUrls: ['./order-detailed.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [TranslatePipe, RouterModule, OrderTotalsComponent, BasketSummaryComponent, MatCardModule, MatButtonModule, MatIconModule, DatePipe]
})
export class OrderDetailedComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  order = signal<IOrder | undefined>(undefined);
  invoice = signal<IInvoice | undefined>(undefined);

  private orderService      = inject(OrdersService);
  private invoiceService    = inject(InvoiceService);
  private activatedRoute    = inject(ActivatedRoute);
  private breadcrumbService = inject(BreadcrumbService);
  private translationService = inject(TranslationService);

  constructor() {
    this.breadcrumbService.set('@OrderDetailed', '');
  }

  ngOnInit(): void {
    this.getOrderDetailed();
  }

  getOrderDetailed(): void {
    const id = this.activatedRoute?.snapshot?.paramMap.get('id');
    if (!id) {
      return;
    }
    this.orderService.getOrderDetailed(+id).subscribe({
      next: (order: IOrder) => {
        this.order.set(order);
        this.breadcrumbService.set('@OrderDetailed',
          this.translationService.translate(TranslationKeys.Orders.DetailCrumb, [order.id, order.status]));
        this.loadInvoice(order.id);
      }, error: (error) => {
        console.log(error);
      }
    });
  }

  /** Paid orders have an invoice; a 204 (unpaid/not yet issued) is expected and shown as "no invoice". */
  private loadInvoice(orderId: number): void {
    this.invoiceService.getInvoiceForOrder(orderId).subscribe({
      next: (invoice) => this.invoice.set(invoice ?? undefined),
      error: () => this.invoice.set(undefined)
    });
  }

  downloadInvoicePdf(): void {
    const inv = this.invoice();
    const order = this.order();
    if (!inv || !order) {
      return;
    }
    this.invoiceService.getInvoicePdfForOrder(order.id).subscribe({
      next: (blob) => this.invoiceService.savePdf(blob, inv.invoiceNumber),
      error: (err) => console.log(err)
    });
  }
}
