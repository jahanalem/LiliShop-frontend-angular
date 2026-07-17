import { ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { IForgotPasswordResponse } from 'src/app/shared/models/forgotPasswordResponse';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, RouterModule, ReactiveFormsModule]
})
export class ForgotPasswordComponent {
  protected readonly TranslationKeys = TranslationKeys;

  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private translationService = inject(TranslationService);

  forgotPasswordForm!: FormGroup;
  isSubmitting = signal<boolean>(false);

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isSubmitting.update(() => true);

      this.accountService.forgotPassword(this.forgotPasswordForm.value.email).pipe(
        finalize(() => { this.isSubmitting.update(() => false); })
      ).subscribe({
        next: (response: IForgotPasswordResponse) => {
          // The content comes from the backend already localized for the request culture.
          const dialogData: IDialogData = {
            content: response.message,
            title: this.translationService.translate(TranslationKeys.Auth.ResetLinkSentTitle),
            showConfirmationButtons: false
          };
          const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });
          dialogRef.afterClosed().subscribe(() => {
            this.router.navigateByUrl('/');
          })
        },
        error: (error) => {
          console.error("The ERROR: ", error);
        }
      })
    }
  }
}