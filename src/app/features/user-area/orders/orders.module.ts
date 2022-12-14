import { OrdersRoutingModule } from './orders-routing.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersComponent } from './orders.component';
import { OrderDetailedComponent } from './order-detailed/order-detailed.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    OrdersComponent,
    OrderDetailedComponent,
  ],
  imports: [
    CommonModule,
    OrdersRoutingModule,
    SharedModule
  ],
  exports: [OrdersComponent, OrderDetailedComponent]
})
export class OrdersModule { }
