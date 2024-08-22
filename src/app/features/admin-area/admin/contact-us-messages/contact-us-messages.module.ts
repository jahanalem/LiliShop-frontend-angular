import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactUsMessagesComponent } from './contact-us-messages.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { SharedModule } from 'src/app/shared/shared.module';
import { ContactUsMessagesRoutingModule } from './contact-us-messages-routing.module';
import { EditContactUsMessagesComponent } from './edit-contact-us-messages/edit-contact-us-messages.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';


@NgModule({
  declarations: [ContactUsMessagesComponent, EditContactUsMessagesComponent],
  imports: [
    CommonModule,
        ContactUsMessagesRoutingModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatIconModule,
        MatSelectModule,
        MatCheckboxModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        SharedModule
  ]
})
export class ContactUsMessagesModule { }
