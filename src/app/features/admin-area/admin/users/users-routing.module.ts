import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UsersComponent } from './users.component';
import { EditUserComponent } from './edit-user/edit-user.component';


const routes: Routes = [
  { path: '', component: UsersComponent },
  { path: 'edit/:id', component: EditUserComponent },
]

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class UsersRoutingModule { }
