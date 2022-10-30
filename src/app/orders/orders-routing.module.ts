import { OrderDetailedComponent } from './order-detailed/order-detailed.component';
import { OrdersComponent } from './orders.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  { path: '', component: OrdersComponent },
  { path: 'order-detailed', component: OrderDetailedComponent },
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
  ]
})
export class OrdersRoutingModule { }
