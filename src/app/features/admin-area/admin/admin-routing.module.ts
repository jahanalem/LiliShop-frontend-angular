
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import AdminComponent from './admin.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { PERMISSION_KIND, PERMISSION_NAME } from 'src/app/shared/constants/auth';


const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { access: PERMISSION_KIND[PERMISSION_NAME.PRIVATE_ACCESS] },
    children: [
      { path: 'products', loadChildren: () => import('./products/products.module').then(m => m.ProductsModule) },
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
