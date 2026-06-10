import { Routes } from '@angular/router';
import { ProductsComponent } from './products.component';
import { EditProductComponent } from './edit-product/edit-product.component';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'edit/:id', component: EditProductComponent },
];
