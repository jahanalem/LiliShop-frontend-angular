import { Routes } from '@angular/router';
import { FulfillmentComponent } from './fulfillment.component';
export const FULFILLMENT_ROUTES: Routes = [
  { path: '', component: FulfillmentComponent },
  { path: ':id', component: FulfillmentComponent }
];
