import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, required, pattern, FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { pattern as patterns } from 'src/app/shared/constants/patterns';
import { ContactService } from 'src/app/core/services/contact.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, 
    TextInputComponent,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    FormsModule,
  ],
})
export class ContactComponent {
  protected readonly TranslationKeys = TranslationKeys;

  private contactService = inject(ContactService);
  private translationService = inject(TranslationService);
  private notificationService = inject(NotificationService);

  readonly isSubmitting = signal(false);

  readonly contactModel = signal<ContactData>({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });

  readonly contactForm = form(this.contactModel, (path) => {
    required(path.firstName, { message: 'First name is required' });
    required(path.lastName, { message: 'Last name is required' });

    required(path.email, { message: 'Email address is required' });
    pattern(path.email, new RegExp(patterns.EMAIL), { message: 'Invalid email address' });

    required(path.message, { message: 'Message is required' });
  });

  onSubmit(): void {
    if (this.contactForm().invalid()) {
      return;
    }

    this.isSubmitting.set(true);

    // NOTE: reconcile this call with your original ContactService method
    // name/signature and your success/reset handling.
    this.contactService.createMessage(this.contactModel()).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translationService.translate(TranslationKeys.Contact.Sent));
        this.resetForm();
        this.isSubmitting.set(false);
      },
      error: (error: any) => {
        this.notificationService.showError(error?.message ?? this.translationService.translate(TranslationKeys.Contact.SendFailed));
        console.error(error);
        this.isSubmitting.set(false);
      },
    });
  }

  private resetForm(): void {
    this.contactModel.set({ firstName: '', lastName: '', email: '', message: '' });
  }
}
