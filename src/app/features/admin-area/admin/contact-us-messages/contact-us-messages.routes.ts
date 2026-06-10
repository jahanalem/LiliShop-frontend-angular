import { Routes } from '@angular/router';
import { ContactUsMessagesComponent } from './contact-us-messages.component';
import { EditContactUsMessagesComponent } from './edit-contact-us-messages/edit-contact-us-messages.component';

export const CONTACT_US_MESSAGES_ROUTES: Routes = [
  { path: '', component: ContactUsMessagesComponent },
  { path: 'edit/:id', component: EditContactUsMessagesComponent },
];
