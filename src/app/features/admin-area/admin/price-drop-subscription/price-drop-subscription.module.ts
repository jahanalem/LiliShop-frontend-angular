import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriceDropSubscriptionComponent } from './price-drop-subscription.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PriceDropSubscriptionRoutingModule } from './price-drop-subscription-routing.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [PriceDropSubscriptionComponent],
  imports: [
    CommonModule,
    SharedModule,
    PriceDropSubscriptionRoutingModule,
    RouterModule
  ]
})
export class PriceDropSubscriptionModule { }
