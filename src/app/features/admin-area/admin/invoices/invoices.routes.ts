import { Routes } from '@angular/router';
import { InvoicesComponent } from './invoices.component';
import { InvoiceDetailComponent } from './invoice-detail/invoice-detail.component';

export const INVOICES_ROUTES: Routes = [
  { path: '', component: InvoicesComponent },
  { path: ':id', component: InvoiceDetailComponent }
];
