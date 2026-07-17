import { ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from 'src/app/core/services/account.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, RouterModule, ReactiveFormsModule]
})
export class ResetPasswordComponent {
  protected readonly TranslationKeys = TranslationKeys;

  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private translationService = inject(TranslationService);

  resetPasswordForm!: FormGroup;
  token = signal<string>('');
  email = signal<string>('');
  date = signal<string>('');

  constructor() {

    this.resetPasswordForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        repeatPassword: ['', [Validators.required]]
      },
      { validator: this.passwordMatchValidator }
    );

    this.route.queryParams.subscribe(params => {
      this.token.set(params['token']);
      this.email.set(params['email']);
      this.date.set(params['date']);
    });
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
      const newPassword = this.resetPasswordForm.get('newPassword')?.value;
      this.accountService.resetPassword(this.token(), this.date(), this.email(), newPassword).subscribe(
        {
          next: () => {
            const dialogData: IDialogData = {
              content: this.translationService.translate(TranslationKeys.Auth.PasswordResetDoneContent),
              title: this.translationService.translate(TranslationKeys.Auth.PasswordResetDoneTitle),
              showConfirmationButtons: false
            };
            const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });
            dialogRef.afterClosed().subscribe(() => {
              this.router.navigate(['/account/login']);
            });
          },
          error: error => {
            console.error('Failed to reset password', error);
          }
        }
      )
    }
  }

  private passwordMatchValidator(formGroup: FormGroup) {
    return formGroup.get('newPassword')?.value === formGroup.get('repeatPassword')?.value
      ? null : { 'mismatch': true };
  }
}