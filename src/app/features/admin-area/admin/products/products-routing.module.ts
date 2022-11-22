import { ProductsComponent } from './products.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EditProductComponent } from './edit-product/edit-product.component';

const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'edit/:id', component: EditProductComponent },
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class ProductsRoutingModule { }
