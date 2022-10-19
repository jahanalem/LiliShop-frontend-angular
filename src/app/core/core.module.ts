import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NgbCollapseModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [NavBarComponent],
  imports: [
    CommonModule,
    NgbCollapseModule,
    NgbModule,
  ],
  exports: [NavBarComponent]
})
export class CoreModule { }
