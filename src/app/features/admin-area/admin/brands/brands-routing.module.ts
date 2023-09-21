import { BrandsComponent } from './brands.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { EditBrandComponent } from './edit-brand/edit-brand.component';


const routes: Routes = [
  { path: '', component: BrandsComponent },
  { path: 'edit/:id', component: EditBrandComponent }
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class BrandsRoutingModule { }
