import { Routes } from '@angular/router';
import { authGuard } from 'src/app/core/guards/auth.guard';
import AdminComponent from './admin.component';
import { PolicyNames } from 'src/app/shared/models/policy';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    canMatch: [authGuard],
    data: { policy: PolicyNames.RequireAtLeastAdminPanelViewerRole },
    children: [
      { path: 'products', loadChildren: () => import('./products/products.routes').then(m => m.PRODUCTS_ROUTES) },
      { path: 'brands', loadChildren: () => import('./brands/brands.routes').then(m => m.BRANDS_ROUTES) },
      { path: 'product-types', loadChildren: () => import('./product-types/product-types.routes').then(m => m.PRODUCT_TYPES_ROUTES) },
      { path: 'contact-us-messages', loadChildren: () => import('./contact-us-messages/contact-us-messages.routes').then(m => m.CONTACT_US_MESSAGES_ROUTES) },
      { path: 'users', loadChildren: () => import('./users/users.routes').then(m => m.USERS_ROUTES) },
      { path: 'subscribers/drop-price', loadChildren: () => import('./price-drop-subscription/price-drop-subscription.routes').then(m => m.PRICE_DROP_SUBSCRIPTION_ROUTES) },
      { path: 'discounts', loadComponent: () => import('./discounts/discounts.component').then(c => c.DiscountsComponent) },
      { path: 'discounts/new', loadComponent: () => import('./discounts/edit-discount/edit-discount.component').then(c => c.EditDiscountComponent) },
      { path: 'discounts/edit/:id', loadComponent: () => import('./discounts/edit-discount/edit-discount.component').then(c => c.EditDiscountComponent) },
      { path: 'profile', loadComponent: () => import('./profile/admin-profile.component').then(c => c.AdminProfileComponent) },
      { path: 'translations', loadComponent: () => import('./translations/translations.component').then(c => c.TranslationsComponent) },
      { path: 'languages', loadComponent: () => import('./languages/languages.component').then(c => c.LanguagesComponent) },
      { path: 'printess-editor', loadComponent: () => import('./printess-editor/printess-editor.component').then(c => c.PrintessEditorComponent) }
    ]
  }
];
