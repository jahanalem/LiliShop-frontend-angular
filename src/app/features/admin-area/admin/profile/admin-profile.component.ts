import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { PolicyNames } from 'src/app/shared/models/policy';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

/**
 * Admin profile page. Its main job today is account security: the self-service MFA recovery for
 * administrators who lost their authenticator device (or their recovery codes) but still have a
 * session. The flow mirrors the backend contract:
 *
 *   password re-confirmation → POST /account/mfa/reset → old secret + recovery codes invalid,
 *   signed out everywhere → next sign-in restarts the standard MFA enrollment (new QR code).
 */
@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
})
export class AdminProfileComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  private accountService = inject(AccountService);
  private authorizationService = inject(AuthorizationService);
  private notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);
  private dialog = inject(MatDialog);

  /** MFA is an obligation of the Administrator/SuperAdmin roles only. */
  readonly canResetMfa = signal<boolean>(false);

  readonly password = signal<string>('');
  readonly resetting = signal<boolean>(false);
  readonly serverError = signal<string | null>(null);

  ngOnInit(): void {
    this.authorizationService
      .isCurrentUserAuthorized(PolicyNames.RequireAtLeastAdministratorRole)
      .subscribe(isAllowed => this.canResetMfa.set(isAllowed));
  }

  resetMfa(): void {
    if (this.resetting()) {
      return;
    }

    if (!this.password().trim()) {
      this.serverError.set(this.translationService.translate(TranslationKeys.Admin.Profile.PasswordRequired));
      return;
    }

    const dialogData: IDialogData = {
      title: this.translationService.translate(TranslationKeys.Admin.Profile.ResetMfaConfirmTitle),
      content: this.translationService.translate(TranslationKeys.Admin.Profile.ResetMfaConfirmContent),
      showConfirmationButtons: true,
    };

    this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((confirmed?: boolean) => {
        if (confirmed) {
          this.performReset();
        }
      });
  }

  private performReset(): void {
    this.resetting.set(true);
    this.serverError.set(null);

    this.accountService.resetAuthenticator(this.password()).subscribe({
      next: (response) => {
        this.resetting.set(false);
        this.notificationService.showSuccess(response.message);
        // Every session (including this one) is already invalid server-side; finish the
        // logout locally so the user lands on the login page and re-enrols cleanly.
        this.accountService.logout();
      },
      error: (err) => {
        this.resetting.set(false);
        this.serverError.set(err?.error?.detail || err?.error?.title
          || this.translationService.translate(TranslationKeys.Admin.Profile.ResetMfaFailed));
      },
    });
  }
}
