import { OrdersRoutingModule } from './orders-routing.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersComponent } from './orders.component';
import { OrderDetailedComponent } from './order-detailed/order-detailed.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

@NgModule({
  declarations: [
    OrdersComponent,
    OrderDetailedComponent,
  ],
  imports: [
    CommonModule,
    OrdersRoutingModule,
    SharedModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
  ],
  exports: [OrdersComponent, OrderDetailedComponent]
})
export class OrdersModule { }
