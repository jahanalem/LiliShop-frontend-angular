import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { EMPTY, Subject, switchMap, takeUntil } from 'rxjs';
import { ContactService } from 'src/app/core/services/contact.service';
import { IContactUsMessage } from 'src/app/shared/models/contactUsMessage';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-edit-contact-us-messages',
  standalone: true,
  templateUrl: './edit-contact-us-messages.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './edit-contact-us-messages.component.scss',
  imports: [MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatInputModule, FormsModule]
})
export class EditContactUsMessagesComponent implements OnInit {
  contactUsMessage = signal<IContactUsMessage>({} as IContactUsMessage);
  replyMessage: string = '';
  enableReply: boolean = false;

  private contactService = inject(ContactService);
  private activatedRoute = inject(ActivatedRoute);
  private router         = inject(Router);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadData()
    this.enableReply = true;
  }

  loadData() {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.destroy$), switchMap((params: ParamMap) => {
        const id = params.get('id');
        if (id!!) {
          return this.contactService.getMessageById(+id);
        }
        else {
          return EMPTY
        }
      })).subscribe({
        next: (data) => {
          this.contactUsMessage.set(data);
        },
        error: (error) => {
          console.log(error);
        }
      });
  }

  sendReply() {
    // TODO: implement sending message to the client!
    console.log('Reply sent:', this.replyMessage);
  }

  cancel() {
    this.router.navigateByUrl('/admin/contact-us-messages');
  }

}