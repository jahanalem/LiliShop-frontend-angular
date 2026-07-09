import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AccountService } from 'src/app/core/services/account.service';
import { IUser } from 'src/app/shared/models/user';


/* MfaVerifyComponent Flow

                  LoginComponent
                         │
                         ▼
          Backend replied:
    RequiresTwoFactorCode = true
                         │
                         ▼
             MfaVerifyComponent
                         │
       User enters TOTP / Recovery Code
                         │
                         ▼
        POST /account/login
 { email, password, twoFactorCode }
                         │
                         ▼
              Backend verifies:
                 ✓ Password
                 ✓ Lockout
                 ✓ MFA Code
                         │
              ┌──────────┴──────────┐
              │                     │
          Success               Failure
              │                     │
              ▼                     ▼
      JWT + Refresh Token     Error message
              │
              ▼
      authenticated.emit(user)
              │
              ▼
         LoginComponent
              │
              ▼
        User is signed in

*/

/**
 * Second factor for administrators. Re-posts the login with the TOTP (or recovery) code — the backend
 * holds no pending-login state, so the credentials plus the code are submitted together.
 */
@Component({
  selector: 'app-mfa-verify',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="mfa-container">
      <h2>Two-factor verification</h2>
      <p>Enter the 6-digit code from your authenticator app. You can also enter a one-time recovery code.</p>

      <form (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Authentication code</mat-label>
          <input
            matInput
            name="code"
            [ngModel]="code()"
            (ngModelChange)="code.set($event)"
            autocomplete="one-time-code"
            inputmode="numeric"
            data-cy="mfa-code"
            required />
        </mat-form-field>

        @if (serverError()) {
          <p class="server-error" data-cy="mfa-error">{{ serverError() }}</p>
        }

        <div class="actions">
          <button mat-button type="button" (click)="cancelled.emit()">Back</button>
          <button
            mat-raised-button
            color="primary"
            type="submit"
            data-cy="mfa-submit"
            [disabled]="submitting() || !code().trim()">
            <mat-icon>verified_user</mat-icon> Verify
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .mfa-container { display: flex; flex-direction: column; gap: 0.75rem; }
    .full-width { width: 100%; }
    .server-error { color: var(--mat-sys-error, #b00020); margin: 0; }
    .actions { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
  `],
})
export class MfaVerifyComponent {
  private accountService = inject(AccountService);

  readonly email = input.required<string>();
  readonly password = input.required<string>();

  readonly authenticated = output<IUser>();
  readonly cancelled = output<void>();

  readonly code = signal<string>('');
  readonly submitting = signal<boolean>(false);
  readonly serverError = signal<string | null>(null);

  submit(): void {
    const code = this.code().trim();
    if (!code || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    this.accountService
      .login({ email: this.email(), password: this.password(), twoFactorCode: code })
      .subscribe({
        next: (user) => {
          this.submitting.set(false);
          if (this.accountService.isAuthenticatedUser(user)) {
            this.authenticated.emit(user);
          } else {
            this.serverError.set('Verification did not complete. Please try again.');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.serverError.set(this.extractError(err));
        },
      });
  }

  private extractError(err: any): string {
    return err?.error?.detail || err?.error?.title || 'Invalid authentication code. Please try again.';
  }
}
