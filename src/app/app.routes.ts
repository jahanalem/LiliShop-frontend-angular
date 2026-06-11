import { Routes } from '@angular/router';
import { NotFoundComponent } from './core/not-found/not-found.component';
import { ServerErrorComponent } from './core/server-error/server-error.component';
import { ConfirmEmailComponent } from './core/confirm-email/confirm-email.component';
import { UnsubscribeConfirmationComponent } from './core/unsubscribe-confirmation/unsubscribe-confirmation.component';
import { PrivacyPolicyComponent } from './shared/components/privacy-policy/privacy-policy.component';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/user-area/user-layout.routes').then(m => m.USER_LAYOUT_ROUTES) },
  { path: 'not-found', component: NotFoundComponent, data: { breadcrumb: 'Not Found' } },
  { path: 'server-error', component: ServerErrorComponent, data: { breadcrumb: 'Server Error' } },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'unsubscribe-confirmation', component: UnsubscribeConfirmationComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'admin', loadChildren: () => import('./features/admin-area/admin/admin.routes').then(m => m.ADMIN_ROUTES) },
  { path: '**', redirectTo: 'not-found' },
];
