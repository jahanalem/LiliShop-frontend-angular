import { SuccessGuard } from './../core/guards/success.guard';
import { CheckoutSuccessComponent } from './checkout-success/checkout-success.component';
import { CheckoutComponent } from './checkout.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

const routes: Routes = [
  { path: '', component: CheckoutComponent },
  { path: 'success', canActivate: [SuccessGuard], component: CheckoutSuccessComponent },
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})
export class CheckoutRoutingModule { }
