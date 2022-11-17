import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { PagingHeaderComponent } from './components/paging-header/paging-header.component';
import { PagerComponent } from './components/pager/pager.component';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { OrderTotalsComponent } from './components/order-totals/order-totals.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TextInputComponent } from './components/text-input/text-input.component';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { StepperComponent } from './components/stepper/stepper.component';
import { BasketSummaryComponent } from './components/basket-summary/basket-summary.component';
import { RouterModule } from '@angular/router';
import { TextTextareaComponent } from './components/text-textarea/text-textarea.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { MatDialogModule } from '@angular/material/dialog';

const components = [
  PagingHeaderComponent,
  PagerComponent,
  OrderTotalsComponent,
  TextInputComponent,
  StepperComponent,
  BasketSummaryComponent,
  TextTextareaComponent,
  DialogComponent,
]
@NgModule({
  declarations: [
    ...components,
  ],
  imports: [
    CommonModule,
    PaginationModule.forRoot(), // as the pagination module has its own provider's array and those providers need to be injected into our routes module and start-up. So this is effectively acting as a singleton anyway. And if we take off the forRoot(), then it won't load with its providers and will have errors.
    CarouselModule.forRoot(),
    BsDropdownModule.forRoot(),
    ReactiveFormsModule,
    FormsModule,
    CdkStepperModule,
    RouterModule,
    MatDialogModule,
  ],
  exports: [
    PaginationModule,
    CarouselModule,
    ReactiveFormsModule,
    FormsModule,
    BsDropdownModule,
    CdkStepperModule,
    ...components
  ]
})
export class SharedModule { }
