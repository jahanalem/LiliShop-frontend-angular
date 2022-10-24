import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { PagingHeaderComponent } from './components/paging-header/paging-header.component';
import { PagerComponent } from './components/pager/pager.component';
import { CarouselModule } from 'ngx-bootstrap/carousel';

@NgModule({
  declarations: [
    PagingHeaderComponent,
    PagerComponent
  ],
  imports: [
    CommonModule,
    PaginationModule.forRoot(), // as the pagination module has its own provider's array and those providers need to be injected into our routes module and start-up. So this is effectively acting as a singleton anyway. And if we take off the forRoot(), then it won't load with its providers and will have errors.
    CarouselModule.forRoot(),
  ],
  exports: [PaginationModule, PagingHeaderComponent, PagerComponent, CarouselModule]
})
export class SharedModule { }
