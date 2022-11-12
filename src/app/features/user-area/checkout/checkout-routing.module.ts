import { CheckoutSuccessComponent } from './checkout-success/checkout-success.component';
import { CheckoutComponent } from './checkout.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { SuccessGuard } from 'src/app/core/guards/success.guard';

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
