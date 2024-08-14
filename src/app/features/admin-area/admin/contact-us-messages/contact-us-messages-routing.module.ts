import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContactUsMessagesComponent } from './contact-us-messages.component';
import { EditContactUsMessagesComponent } from './edit-contact-us-messages/edit-contact-us-messages.component';



const routes: Routes = [
  { path: '', component: ContactUsMessagesComponent },
  { path: 'edit/:id', component: EditContactUsMessagesComponent },
]

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class ContactUsMessagesRoutingModule { }
