import { Routes } from '@angular/router';
import { ProductTypesComponent } from './product-types.component';
import { EditProductTypeComponent } from './edit-product-type/edit-product-type.component';

export const PRODUCT_TYPES_ROUTES: Routes = [
  { path: '', component: ProductTypesComponent },
  { path: 'edit/:id', component: EditProductTypeComponent },
];
