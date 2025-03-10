import { BreadcrumbService } from 'xng-breadcrumb';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { IOrder } from 'src/app/shared/models/order';
import { OrdersService } from 'src/app/core/services/orders.service';

@Component({
    selector: 'app-order-detailed',
    templateUrl: './order-detailed.component.html',
    styleUrls: ['./order-detailed.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class OrderDetailedComponent implements OnInit {
  order = signal<IOrder | undefined>(undefined);

  private orderService      = inject(OrdersService);
  private activatedRoute    = inject(ActivatedRoute);
  private breadcrumbService = inject(BreadcrumbService);

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
        this.breadcrumbService.set('@OrderDetailed', `Order# ${order.id} - ${order.status}`);
      }, error: (error) => {
        console.log(error);
      }
    });
  }
}
