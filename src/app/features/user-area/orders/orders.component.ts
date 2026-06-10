import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { OrdersService } from 'src/app/core/services/orders.service';
import { IOrder } from 'src/app/shared/models/order';


import { MatChipsModule } from '@angular/material/chips';

@Component({
    selector: 'app-orders',
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [CommonModule, RouterModule, MatChipsModule, MatButtonModule, MatTableModule, MatCardModule]
})
export class OrdersComponent implements OnInit {
  orders = signal<IOrder[]>([]);
  displayedColumns: string[] = ['orderId', 'date', 'total', 'status', 'action'];
  private orderService = inject(OrdersService);

  constructor() { }

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