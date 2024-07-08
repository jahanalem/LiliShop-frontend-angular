import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { IForgotPasswordResponse } from 'src/app/shared/models/forgotPasswordResponse';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
  forgotPasswordForm!: FormGroup;
  isSubmitting = signal<boolean>(false);

  constructor(private fb: FormBuilder,
    private accountService: AccountService,
    private dialog: MatDialog,
    private router: Router) {
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
          console.log(response);
          const dialogData: IDialogData = {
            content: response.message,
            title: "Reset Password Link Sent",
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
