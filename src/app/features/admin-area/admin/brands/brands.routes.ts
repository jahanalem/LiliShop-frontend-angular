import { Routes } from '@angular/router';
import { BrandsComponent } from './brands.component';
import { EditBrandComponent } from './edit-brand/edit-brand.component';

export const BRANDS_ROUTES: Routes = [
  { path: '', component: BrandsComponent },
  { path: 'edit/:id', component: EditBrandComponent }
];
