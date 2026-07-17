import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import * as QRCode from 'qrcode';
import { AccountService } from 'src/app/core/services/account.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

/* MfaSetupComponent Flow

            Component Created
                   │
                   ▼
        loadSetup() → POST /mfa/setup
                   │
                   ▼
          stage = "scan"
                   │
      User scans the QR code
                   │
                   ▼
      User enters first 6-digit code
                   │
                   ▼
       POST /mfa/enable
                   │
          Code is valid?
            │         │
           No        Yes
            │         ▼
     Show error   stage = "recovery"
                      │
          Show recovery codes
                      │
       User confirms they are saved
                      │
                      ▼
             enrolled.emit()
                      │
                      ▼
          Parent switches to MFA Verify

*/

/**
 * Authenticator (TOTP) enrolment for administrators without MFA. Fetches the shared key + otpauth URI,
 * renders a QR code, verifies the first code, then shows one-time recovery codes behind a mandatory
 * "I have saved these" gate before allowing the user to proceed to sign-in.
 */
@Component({
  selector: 'app-mfa-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCheckboxModule, TranslatePipe],
  template: `
    <div class="mfa-container">
      @if (stage() === 'scan') {
        <h2>{{ TranslationKeys.Mfa.SetupTitle | translate }}</h2>
        <p>{{ TranslationKeys.Mfa.SetupIntro | translate }}</p>

        @if (loading() && !sharedKey()) {
          <p>{{ TranslationKeys.Mfa.PreparingSetup | translate }}</p>
        }

        @if (qrDataUrl()) {
          <img [src]="qrDataUrl()" [alt]="TranslationKeys.Mfa.QrAlt | translate" class="qr" />
        }

        @if (sharedKey()) {
          <p class="manual-key">
            {{ TranslationKeys.Mfa.ManualKeyHint | translate }}<br />
            <code data-cy="mfa-shared-key">{{ sharedKey() }}</code>
          </p>

          <form (ngSubmit)="enable()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ TranslationKeys.Mfa.VerificationCode | translate }}</mat-label>
              <input
                matInput
                name="code"
                [ngModel]="code()"
                (ngModelChange)="code.set($event)"
                autocomplete="one-time-code"
                inputmode="numeric"
                data-cy="mfa-setup-code"
                required />
            </mat-form-field>

            @if (serverError()) {
              <p class="server-error">{{ serverError() }}</p>
            }

            <div class="actions">
              <button mat-button type="button" (click)="cancelled.emit()">{{ TranslationKeys.Common.Back | translate }}</button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                data-cy="mfa-enable"
                [disabled]="loading() || !code().trim()">
                <mat-icon>check</mat-icon> {{ TranslationKeys.Mfa.Enable | translate }}
              </button>
            </div>
          </form>
        }

        @if (serverError() && !sharedKey()) {
          <p class="server-error">{{ serverError() }}</p>
          <button mat-button type="button" (click)="cancelled.emit()">{{ TranslationKeys.Mfa.BackToLogin | translate }}</button>
        }
      } @else {
        <h2>{{ TranslationKeys.Mfa.RecoveryTitle | translate }}</h2>
        <p>
          <strong>{{ TranslationKeys.Mfa.RecoveryIntro | translate }}</strong>
        </p>

        <ul class="recovery-codes" data-cy="recovery-codes">
          @for (rc of recoveryCodes(); track rc) {
            <li><code>{{ rc }}</code></li>
          }
        </ul>

        <button mat-stroked-button type="button" (click)="copyRecoveryCodes()">
          <mat-icon>content_copy</mat-icon> {{ TranslationKeys.Mfa.CopyCodes | translate }}
        </button>

        <mat-checkbox
          name="saved"
          [ngModel]="savedConfirmed()"
          (ngModelChange)="savedConfirmed.set($event)"
          data-cy="recovery-confirm">
          {{ TranslationKeys.Mfa.SavedConfirm | translate }}
        </mat-checkbox>

        <div class="actions">
          <button
            mat-raised-button
            color="primary"
            type="button"
            data-cy="mfa-finish"
            [disabled]="!savedConfirmed()"
            (click)="finish()">
            {{ TranslationKeys.Mfa.ContinueToSignIn | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .mfa-container { display: flex; flex-direction: column; gap: 0.75rem; }
    .full-width { width: 100%; }
    .qr { align-self: center; width: 220px; height: 220px; }
    .manual-key code { word-break: break-all; }
    .server-error { color: var(--mat-sys-error, #b00020); margin: 0; }
    .recovery-codes { list-style: none; padding: 0.75rem 1rem; margin: 0; background: rgba(0,0,0,0.04); border-radius: 6px; }
    .recovery-codes li { font-family: monospace; }
    .actions { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    mat-checkbox { margin-top: 0.5rem; }
  `],
})
export class MfaSetupComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  private accountService = inject(AccountService);
  private translationService = inject(TranslationService);

  readonly email = input.required<string>();
  readonly password = input.required<string>();

  readonly enrolled = output<void>();
  readonly cancelled = output<void>();

  readonly stage = signal<'scan' | 'recovery'>('scan');
  readonly sharedKey = signal<string>('');
  readonly qrDataUrl = signal<string>('');
  readonly code = signal<string>('');
  readonly recoveryCodes = signal<string[]>([]);
  readonly savedConfirmed = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly serverError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSetup();
  }

  private loadSetup(): void {
    this.loading.set(true);
    this.serverError.set(null);

    this.accountService.getAuthenticatorSetup(this.email(), this.password()).subscribe({
      next: async (setup) => {
        this.sharedKey.set(setup.sharedKey);
        try {
          this.qrDataUrl.set(await QRCode.toDataURL(setup.authenticatorUri, { margin: 1, width: 220 }));
        } catch {
          // If QR rendering fails the manual key entry path still works.
          this.qrDataUrl.set('');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(this.extractError(err, TranslationKeys.Mfa.SetupFailed));
      },
    });
  }

  enable(): void {
    const code = this.code().trim();
    if (!code || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.accountService.enableAuthenticator(this.email(), this.password(), code).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.recoveryCodes.set(result.recoveryCodes ?? []);
        this.stage.set('recovery');
      },
      error: (err) => {
        this.loading.set(false);
        this.serverError.set(this.extractError(err, TranslationKeys.Mfa.InvalidCode));
      },
    });
  }

  copyRecoveryCodes(): void {
    navigator.clipboard?.writeText(this.recoveryCodes().join('\n')).catch(() => {
      this.serverError.set(this.translationService.translate(TranslationKeys.Mfa.CopyFailed));
    });
  }

  finish(): void {
    if (this.savedConfirmed()) {
      this.enrolled.emit();
    }
  }

  /** Server errors arrive already localized (ProblemDetails.detail); the key is the local fallback. */
  private extractError(err: any, fallbackKey: string): string {
    return err?.error?.detail || err?.error?.title || this.translationService.translate(fallbackKey);
  }
}
