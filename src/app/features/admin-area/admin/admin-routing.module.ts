import { AuthGuard } from 'src/app/core/guards/auth.guard';
import AdminComponent from './admin.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { PERMISSIONS, PERMISSION_LABELS } from 'src/app/shared/constants/auth';


const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { access: PERMISSIONS[PERMISSION_LABELS.PRIVATE_ACCESS] },
    children: [
      { path: 'products', loadChildren: () => import('./products/products.module').then(m => m.ProductsModule) },
      { path: 'brands', loadChildren: () => import('./brands/brands.module').then(m => m.BrandsModule) },
      { path: 'product-types', loadChildren: () => import('./product-types/product-types.module').then(m => m.ProductTypesModule) },
      { path: 'users', loadChildren: () => import('./users/users.module').then(m => m.UsersModule) }
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
