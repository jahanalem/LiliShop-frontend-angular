import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ContactService } from 'src/app/core/services/contact.service';
import { BaseEntityKeys } from 'src/app/shared/models/baseEntity';
import { IContactUsMessage } from 'src/app/shared/models/contactUsMessage';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;

  private contactService = inject(ContactService);
  private toastr         = inject(ToastrService);

  isSubmitting = signal<boolean>(false);

  constructor() { }

  ngOnInit(): void {
    this.createContactForm();
  }

  createContactForm() {
    this.contactForm = new FormGroup({
      firstName: new FormControl('', [Validators.required]),
      lastName : new FormControl('', [Validators.required]),
      message  : new FormControl('', [Validators.required]),
      email    : new FormControl('', [Validators.required, Validators.email]),
    });
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    const message = this.contactForm.value as Omit<IContactUsMessage, BaseEntityKeys>;
    this.contactService.createMessage(message).subscribe({
      next: () => {
        this.toastr.success('Message sent successfully', 'Success');
        this.resetForm();
      },
      error: err => {
        this.isSubmitting.set(false);
        this.toastr.error('Error sending message', 'Error');
        console.log("Error is: ", err);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  private resetForm() {
    this.contactForm.reset();

    Object.keys(this.contactForm.controls).forEach((key) => {
      const control = this.contactForm.get(key);
      control?.setValue('');
      control?.setErrors(null);
      control?.markAsUntouched();
      control?.markAsPristine();
      control?.updateValueAndValidity();
    });
  }
}
