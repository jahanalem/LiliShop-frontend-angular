import AdminComponent from './admin.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

const routes: Routes = [
  {
    path: '', component: AdminComponent, children: [
      { path: 'product', loadChildren: () => import('./product/product.module').then(m => m.ProductModule) },
      { path: 'brand', loadChildren: () => import('./brand/brand.module').then(m => m.BrandModule) },
    ]
  }
]

@NgModule({
  declarations: [],
  imports: [
    RouterModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
