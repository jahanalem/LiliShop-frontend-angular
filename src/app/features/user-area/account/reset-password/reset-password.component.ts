import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from 'src/app/core/services/account.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent {
  resetPasswordForm!: FormGroup;
  token = signal<string>('');
  email = signal<string>('');
  date = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog) {

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
            console.log('Password successfully reset');
            const dialogData: IDialogData = {
              content: "Password successfully reset",
              title: "Reset Password",
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
