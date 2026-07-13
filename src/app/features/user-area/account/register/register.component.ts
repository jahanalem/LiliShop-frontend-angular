import {
  ChangeDetectionStrategy,
  Component,
  inject,
  NgZone,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  form,
  submit,
  required,
  pattern,
  validate,
  validateAsync,
  type ValidationError,
} from '@angular/forms/signals';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { pattern as patterns } from 'src/app/shared/constants/patterns';
import { errorType } from 'src/app/shared/constants/error-types';
import { AccountService } from 'src/app/core/services/account.service';
import { CredentialResponse, PromptMomentNotification } from 'google-one-tap';
import { environment } from 'src/environments/environment';
import { IUser } from 'src/app/shared/models/user';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

declare namespace google {
  namespace accounts {
    namespace id {
      function initialize(config: any): void;
      function renderButton(element: HTMLElement, config: any): void;
      function prompt(callback: (notification: PromptMomentNotification) => void): void;
    }
  }
}

interface RegisterData {
  displayName    : string;
  email          : string;
  password       : string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextInputComponent, MatButtonModule, MatIconModule, FormsModule, TranslatePipe],
})
export class RegisterComponent implements OnInit {
  protected readonly TranslationKeys = TranslationKeys;

  private readonly accountService = inject(AccountService);
  private readonly router         = inject(Router);
  private readonly ngZone         = inject(NgZone);
  private readonly dialog         = inject(MatDialog);

  private readonly clientId = environment.google_clientId;

  /** Top-level server errors shown beneath the form. */
  readonly errors = signal<string[]>([]);

  // 1. The data model — the form's single source of truth
  readonly registerModel = signal<RegisterData>({
    displayName    : '',
    email          : '',
    password       : '',
    confirmPassword: '',
  });

  // 2. The form + all validation rules in one schema
  readonly registerForm = form(this.registerModel, (path) => {
    required(path.displayName, { message: 'Display Name is required' });

    required(path.email, { message: 'Email address is required' });
    // patterns.EMAIL is a string constant, so wrap it in a RegExp for signal-forms pattern()
    pattern(path.email, new RegExp(patterns.EMAIL), {
      message: 'Invalid email address',
    });

    // Async: email must not already be taken (debounced + cached)
    validateAsync(path.email, {
      params: (ctx) => ctx.value(),
      factory: (emailSignal) =>
        rxResource({
          params: () => emailSignal(),
          stream: ({ params: email }) => {
            if (!email) return of(false);
            if (this.emailCache.has(email)) return of(this.emailCache.get(email)!);
            return timer(500).pipe(
              switchMap(() => this.accountService.checkEmailExists(email)),
            );
          },
        }),
      onSuccess: (taken: boolean): ValidationError | undefined => {
        const email = this.registerModel().email;
        if (email) this.emailCache.set(email, taken);
        return taken
          ? { kind: errorType.EMAIL_EXISTS, message: 'Email address is in use' }
          : undefined;
      },
      onError: (): ValidationError => ({
        kind: errorType.UNKNOWN_ERROR,
        message: 'Could not verify the email. Please try again.',
      }),
    });

    required(path.password, { message: 'Password is required' });
    // patterns.PASSWORD is a string constant, so wrap it in a RegExp
    pattern(path.password, new RegExp(patterns.PASSWORD), {
      message:
        'Password must have 1 Uppercase, 1 Lowercase, 1 number, 1 non-alphanumeric, and at least 6 characters',
    });

    required(path.confirmPassword, { message: 'Confirm Password is required' });

    // Cross-field: confirmation must match the password
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() !== valueOf(path.password)
        ? { kind: errorType.MATCHING, message: 'Confirm Password does not match' }
        : null,
    );
  });

  /** Cache of already-verified email addresses, avoiding redundant API calls. */
  private readonly emailCache = new Map<string, boolean>();

  ngOnInit(): void {
    this.loadGoogleScript();
  }

  onSubmit(): void {
    submit(this.registerForm, async () => {
      try {
        const response = await this.accountService
          .register(this.registerModel())
          .toPromise();

        const customMessage = response?.headers.get(
          'LiliShop-Registration-Status-Message',
        );
        if (customMessage) {
          this.openDialog('Email Confirmation Error', customMessage);
        } else {
          this.openDialog(
            'Email Confirmation Sent',
            'A confirmation link has been sent to your email. Please confirm it.',
          );
        }
        return null; // success
      } catch (error: any) {
        this.errors.set(error?.errors ?? ['Registration failed']);
        return [];
      }
    });
  }

  private openDialog(title: string, content: string): void {
    const dialogData: IDialogData = {
      title,
      content,
      showConfirmationButtons: false,
    };
    this.dialog
      .open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe(() => this.router.navigateByUrl('/shop'));
  }

  // --- Google Sign-In (unchanged behaviour) ---

  private loadGoogleScript(): void {
    const googleScript = document.createElement('script');
    googleScript.src = 'https://accounts.google.com/gsi/client';
    googleScript.async = true;
    googleScript.defer = true;
    googleScript.onload = () => this.initializeGoogleSignIn();
    document.body.appendChild(googleScript);
  }

  private initializeGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const buttonDiv = document.getElementById('buttonDiv');
    if (buttonDiv) {
      google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: '100%',
      });
    }

    google.accounts.id.prompt((_n: PromptMomentNotification) => {});
  }

  private handleCredentialResponse(response: CredentialResponse): void {
    this.accountService.LoginWithGoogle(response.credential).subscribe({
      next: (user: IUser) => {
        this.accountService.updateCurrentUserState(user);
        this.ngZone.run(() => this.router.navigateByUrl('/shop'));
      },
      error: (error: any) => {
        // Administrator accounts are blocked from single-factor Google sign-in by the backend (they must
        // use email + password + MFA). Show the backend message cleanly rather than failing silently.
        const message =
          error?.error?.detail ||
          error?.error?.title ||
          'Google sign-in could not be completed. Please try again.';
        this.ngZone.run(() => this.errors.set([message]));
      },
    });
  }
}
