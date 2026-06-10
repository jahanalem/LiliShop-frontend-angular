import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, required, pattern } from '@angular/forms/signals';
import { map, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { pattern as patterns } from 'src/app/shared/constants/patterns';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { PolicyNames } from 'src/app/shared/models/policy';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';

interface LoginData {
  email: string;
  password: string;
}

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
  ],
})
export class LoginComponent implements OnInit {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authorizationService = inject(AuthorizationService);

  readonly returnUrl = signal<string>('/');

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
    if (this.loginForm().invalid()) {
      return;
    }

    this.accountService
      .login(this.loginModel())
      .pipe(
        switchMap((user) => {
          if (user) {
            return this.authorizationService
              .isCurrentUserAuthorized(PolicyNames.RequireAtLeastAdminPanelViewerRole, user.role)
              .pipe(map((isAllowed) => ({ user, isAllowed })));
          }
          return of(null);
        }),
      )
      .subscribe({
        next: (result) => {
          if (result) {
            this.router.navigateByUrl(result.isAllowed ? 'admin' : this.returnUrl());
          }
        },
        error: (err) => console.error('Submit failed!', err),
      });
  }
}
