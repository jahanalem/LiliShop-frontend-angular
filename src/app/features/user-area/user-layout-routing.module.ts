import { UserLayoutComponent } from './user-layout.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {
    path: '', component: UserLayoutComponent, children: [
      { path: '', component: HomeComponent, data: { breadcrumb: 'Home' } },
      { path: 'shop', loadChildren: () => import('./shop/shop.module').then(mod => mod.ShopModule), data: { breadcrumb: 'Shop' } },
      { path: 'basket', loadChildren: () => import('./basket/basket.module').then(mod => mod.BasketModule), data: { breadcrumb: 'Basket' } },
      { path: 'checkout', canActivate: [AuthGuard], loadChildren: () => import('./checkout/checkout.module').then(mod => mod.CheckoutModule), data: { breadcrumb: 'Checkout' } },
      { path: 'account', loadChildren: () => import('../user-area/account/account.module').then(mod => mod.AccountModule), data: { breadcrumb: { skip: true } } },
      { path: 'orders', canActivate: [AuthGuard], loadChildren: () => import('./orders/orders.module').then(mod => mod.OrdersModule), data: { breadcrumb: 'orders' } },
      { path: 'about', loadChildren: () => import('./about/about.module').then(mod => mod.AboutModule), data: { breadcrumb: 'About' } },
      { path: 'contact', loadChildren: () => import('./contact/contact.module').then(mod => mod.ContactModule), data: { breadcrumb: 'Contact' } },
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
export class UserLayoutRoutingModule { }
