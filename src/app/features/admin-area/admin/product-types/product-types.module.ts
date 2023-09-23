import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductTypesComponent } from './product-types.component';
import { EditProductTypeComponent } from './edit-product-type/edit-product-type.component';
import { ProductTypesRoutingModule } from './product-types-routing.module';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';


@NgModule({
  declarations: [
    ProductTypesComponent,
    EditProductTypeComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ProductTypesRoutingModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    ReactiveFormsModule,
  ]
})
export class ProductTypesModule { }
