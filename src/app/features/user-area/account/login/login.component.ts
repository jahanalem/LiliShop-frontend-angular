import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, required, pattern } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { pattern as patterns } from 'src/app/shared/constants/patterns';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { PolicyNames } from 'src/app/shared/models/policy';
import { IUser } from 'src/app/shared/models/user';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { MfaVerifyComponent } from '../mfa/mfa-verify.component';
import { MfaSetupComponent } from '../mfa/mfa-setup.component';

/* LoginComponent Authentication Flow

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                LoginComponent Authentication Flow                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                              User enters Email + Password
                                           │
                                           ▼
                              POST /account/login
                              { email, password }
                                           │
                                           ▼
                          ┌────────────────────────────────┐
                          │            Backend             │
                          │                                │
                          │ ✓ Find user                    │
                          │ ✓ Check password               │
                          │ ✓ Check account lockout        │
                          │ ✓ Is MFA required?             │
                          └────────────────────────────────┘
                                           │
                 ┌─────────────────────────┼──────────────────────────┐
                 │                         │                          │
                 ▼                         ▼                          ▼
      Token issued                 RequiresTwoFactorSetup      RequiresTwoFactorCode
      Token != ""                  Token = ""                 Token = ""
                                   setup = true              code = true
                                   code = false             setup = false
                 │                         │                          │
                 ▼                         ▼                          ▼
        completeLogin()          Show MfaSetupComponent      Show MfaVerifyComponent
                 │                         │                          │
                 │                         │                          │
                 │                         ▼                          │
                 │          POST /account/mfa/setup                   │
                 │          { email, password }                       │
                 │                         │                          │
                 │                         ▼                          │
                 │              Backend verifies password             │
                 │                         │                          │
                 │                         ▼                          │
                 │          Generate/Get Authenticator Secret         │
                 │                         │                          │
                 │                         ▼                          │
                 │        Return SharedKey + QR Code URI              │
                 │                         │                          │
                 │                         ▼                          │
                 │        User scans QR with Authenticator            │
                 │                         │                          │
                 │                         ▼                          │
                 │     User enters first 6-digit verification code    │
                 │                         │                          │
                 │                         ▼                          │
                 │          POST /account/mfa/enable                  │
                 │          { email, password, code }                 │
                 │                         │                          │
                 │                         ▼                          │
                 │             Backend verifies:                      │
                 │             ✓ Password                             │
                 │             ✓ First TOTP code                      │
                 │             ✓ Enable MFA                           │
                 │             ✓ Generate recovery codes              │
                 │                         │                          │
                 │                         ▼                          │
                 │          Show recovery codes                       │
                 │                         │                          │
                 │                         ▼                          │
                 │         User confirms they saved them              │
                 │                         │                          │
                 │                         ▼                          │
                 │             Switch to MfaVerifyComponent ◄─────────┘
                 │                         │
                 │                         ▼
                 │          User enters TOTP / Recovery Code
                 │                         │
                 │                         ▼
                 │              POST /account/login
                 │      { email, password, twoFactorCode }
                 │                         │
                 │                         ▼
                 │             Backend verifies:
                 │             ✓ Password
                 │             ✓ Lockout
                 │             ✓ TOTP or Recovery Code
                 │                         │
                 │                Token issued
                 └─────────────────────────┘
                                           │
                                           ▼
                                   completeLogin()
                                           │
                                           ▼
                                      Navigate User

*/

interface LoginData {
  email: string;
  password: string;
}

type LoginStage = 'credentials' | 'verify' | 'setup';

/* sample form: https://mdbootstrap.com/docs/standard/extended/login/ */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TextInputComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    FormsModule,
    RouterLink,
    MfaVerifyComponent,
    MfaSetupComponent,
  ],
})
export class LoginComponent implements OnInit {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authorizationService = inject(AuthorizationService);

  readonly returnUrl = signal<string>('/');

  // Multi-stage login state (credentials -> MFA verify / setup for admins). Credentials are kept only in
  // memory for the duration of the MFA flow and never persisted.
  readonly stage = signal<LoginStage>('credentials');
  readonly credentials = signal<LoginData>({ email: '', password: '' });
  readonly submitting = signal<boolean>(false);
  readonly serverError = signal<string | null>(null);

  // 1. The data model
  readonly loginModel = signal<LoginData>({ email: '', password: '' });

  // 2. The form + validation
  readonly loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'Email address is required' });
    // patterns.EMAIL is a string constant, so wrap it in a RegExp
    pattern(path.email, new RegExp(patterns.EMAIL), { message: 'Invalid email address' });

    required(path.password, { message: 'Password is required' });
  });

  ngOnInit(): void {
    this.returnUrl.set(this.activatedRoute.snapshot.queryParams['returnUrl'] || '/shop');
  }

  onSubmit(): void {
    if (this.loginForm().invalid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);
    const creds = this.loginModel();

    this.accountService.login(creds).subscribe({
      next: (user) => {
        this.submitting.set(false);
        this.handleLoginResponse(user, creds);
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err?.error?.detail || err?.error?.title || 'Invalid email or password.');
      },
    });
  }

  /** Routes the login response: authenticated -> finish; otherwise enter the required MFA stage. */
  private handleLoginResponse(user: IUser, creds: LoginData): void {
    if (this.accountService.isAuthenticatedUser(user)) {
      this.completeLogin(user);
      return;
    }

    // MFA required — keep credentials in memory to complete the second step.
    this.credentials.set({ email: creds.email, password: creds.password });

    if (user.requiresTwoFactorSetup) {
      this.stage.set('setup');
    } else if (user.requiresTwoFactorCode) {
      this.stage.set('verify');
    }
  }

  /** Called by the MFA verify child once a full token has been issued. */
  onVerified(user: IUser): void {
    this.completeLogin(user);
  }

  /** Called by the MFA setup child once enrolment + recovery-code confirmation is complete. */
  onEnrolled(): void {
    // Enrolment finished; require a fresh authenticator code to actually sign in.
    this.stage.set('verify');
  }

  /** Cancel the MFA flow and return to the credentials form, discarding the in-memory credentials. */
  onCancelMfa(): void {
    this.credentials.set({ email: '', password: '' });
    this.stage.set('credentials');
  }

  private completeLogin(user: IUser): void {
    this.authorizationService
      .isCurrentUserAuthorized(PolicyNames.RequireAtLeastAdminPanelViewerRole, user.role)
      .subscribe((isAllowed) => {
        this.router.navigateByUrl(isAllowed ? 'admin' : this.returnUrl());
      });
  }
}
