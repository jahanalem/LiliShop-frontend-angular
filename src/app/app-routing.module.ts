import { ServerErrorComponent } from './core/server-error/server-error.component';
import { NotFoundComponent } from './core/not-found/not-found.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfirmEmailComponent } from './core/confirm-email/confirm-email.component';
import { UnsubscribeConfirmationComponent } from './core/unsubscribe-confirmation/unsubscribe-confirmation.component';
import { PrivacyPolicyComponent } from './shared/components/privacy-policy/privacy-policy.component';


const routes: Routes = [
  { path: '', loadChildren: () => import('./features/user-area/user-layout.module').then(mod => mod.UserLayoutModule) },
  { path: 'not-found', component: NotFoundComponent, data: { breadcrumb: 'Not Found' } },
  { path: 'server-error', component: ServerErrorComponent, data: { breadcrumb: 'Server Error' } },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'unsubscribe-confirmation', component: UnsubscribeConfirmationComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'admin', loadChildren: () => import('./features/admin-area/admin/admin.module').then(mod => mod.AdminModule) },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
