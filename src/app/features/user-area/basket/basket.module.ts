import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasketComponent } from './basket.component';
import { BasketRoutingModule } from './basket-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [
    
  ],
  imports: [
    CommonModule,
    BasketRoutingModule,
    SharedModule,
    BasketComponent
  ]
})
export class BasketModule { }
