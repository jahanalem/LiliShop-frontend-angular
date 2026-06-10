import { Routes } from '@angular/router';
import { UserLayoutComponent } from './user-layout.component';
import { authGuard } from 'src/app/core/guards/auth.guard';

export const USER_LAYOUT_ROUTES: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: '', redirectTo: 'shop', pathMatch: 'full' },
      { path: 'shop', loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES), data: { breadcrumb: 'Shop' } },
      { path: 'basket', loadChildren: () => import('./basket/basket.routes').then(m => m.BASKET_ROUTES), data: { breadcrumb: 'Basket' } },
      { path: 'checkout', canMatch: [authGuard], loadChildren: () => import('./checkout/checkout.routes').then(m => m.CHECKOUT_ROUTES), data: { breadcrumb: 'Checkout' } },
      { path: 'account', loadChildren: () => import('./account/account.routes').then(m => m.ACCOUNT_ROUTES), data: { breadcrumb: { skip: true } } },
      { path: 'orders', canMatch: [authGuard], loadChildren: () => import('./orders/orders.routes').then(m => m.ORDERS_ROUTES), data: { breadcrumb: 'orders' } },
      { path: 'about', loadChildren: () => import('./about/about.routes').then(m => m.ABOUT_ROUTES), data: { breadcrumb: 'About' } },
      { path: 'contact', loadChildren: () => import('./contact/contact.routes').then(m => m.CONTACT_ROUTES), data: { breadcrumb: 'Contact' } },
      { path: 'price-drop-subscriptions', loadComponent: () => import('./profile/user-price-drop-subscriptions/user-price-drop-subscriptions.component').then((c) => c.UserPriceDropSubscriptionsComponent), data: { breadcrumb: 'My Subscriptions' } }
    ]
  }
];
