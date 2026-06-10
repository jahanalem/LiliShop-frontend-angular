import { Routes } from '@angular/router';
import { CheckoutComponent } from './checkout.component';
import { CheckoutSuccessComponent } from './checkout-success/checkout-success.component';
import { successMatchGuard } from 'src/app/core/guards/success.guard';

export const CHECKOUT_ROUTES: Routes = [
  { path: '', component: CheckoutComponent },
  { path: 'success', canMatch: [successMatchGuard], component: CheckoutSuccessComponent },
];
