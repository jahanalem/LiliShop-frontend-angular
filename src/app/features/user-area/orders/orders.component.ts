
import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { OrdersService } from 'src/app/core/services/orders.service';
import { IOrder } from 'src/app/shared/models/order';


@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements OnInit {
  orders = signal<IOrder[]>([]);

  constructor(private orderService: OrdersService) { }

  ngOnInit(): void {
    this.getOrders();
  }

  getOrders() {
    return this.orderService.getOrdersForUser().subscribe({
      next: (orders: IOrder[]) => {
        this.orders.set(orders);
      },
      error: error => { console.error(error); }
    });
  }
}
