import { SharedModule } from 'src/app/shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserLayoutComponent } from './user-layout.component';
import { UserLayoutRoutingModule } from './user-layout-routing.module';
import { CoreModule } from 'src/app/core/core.module';



@NgModule({
  declarations: [
    UserLayoutComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    UserLayoutRoutingModule
  ],
})
export class UserLayoutModule { }
