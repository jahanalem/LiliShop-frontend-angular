import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PriceDropSubscriptionComponent } from './price-drop-subscription.component';

const routes: Routes = [
  { path: '', component: PriceDropSubscriptionComponent }
]

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class PriceDropSubscriptionRoutingModule { }
