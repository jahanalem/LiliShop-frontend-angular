import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductTypesComponent } from './product-types.component';
import { EditProductTypeComponent } from './edit-product-type/edit-product-type.component';

const routes: Routes = [
  { path: '', component: ProductTypesComponent },
  { path: 'edit/:id', component: EditProductTypeComponent },
]

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class ProductTypesRoutingModule { }
