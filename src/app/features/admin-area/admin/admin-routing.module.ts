import { authGuard } from 'src/app/core/guards/auth.guard';
import AdminComponent from './admin.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { PolicyNames } from 'src/app/shared/models/policy';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canMatch: [authGuard],
    data: { policy: PolicyNames.RequireAtLeastAdminPanelViewerRole },
    children: [
      { path: 'products', loadChildren: () => import('./products/products.module').then(m => m.ProductsModule) },
      { path: 'brands', loadChildren: () => import('./brands/brands.module').then(m => m.BrandsModule) },
      { path: 'product-types', loadChildren: () => import('./product-types/product-types.module').then(m => m.ProductTypesModule) },
      { path: 'contact-us-messages', loadChildren: () => import('./contact-us-messages/contact-us-messages.module').then(m => m.ContactUsMessagesModule) },
      { path: 'users', loadChildren: () => import('./users/users.module').then(m => m.UsersModule) },
      { path: 'subscribers/drop-price', loadChildren: () => import('./price-drop-subscription/price-drop-subscription.module').then(m => m.PriceDropSubscriptionModule) },
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
