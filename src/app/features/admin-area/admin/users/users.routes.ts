import { Routes } from '@angular/router';
import { UsersComponent } from './users.component';
import { EditUserComponent } from './edit-user/edit-user.component';

export const USERS_ROUTES: Routes = [
  { path: '', component: UsersComponent },
  { path: 'edit/:id', component: EditUserComponent },
];
