
import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { pattern } from 'src/app/shared/constants/patterns';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { PolicyNames } from 'src/app/shared/models/policy';

/* sample form: https://mdbootstrap.com/docs/standard/extended/login/ */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;

  isFormValid = signal<boolean>(false);
  returnUrl   = signal<string>('/');

  destroy$ = new Subject<void>();

  private accountService       = inject(AccountService);
  private router               = inject(Router);
  private activatedRoute       = inject(ActivatedRoute);
  private fb                   = inject(FormBuilder);
  private authorizationService = inject(AuthorizationService);

  constructor() {

  }

  ngOnInit(): void {
    this.returnUrl.set(this.activatedRoute.snapshot.queryParams['returnUrl'] || '/shop');
    this.createLoginForm();
    this.loginForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isFormValid.update(() => this.loginForm.valid);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createLoginForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(pattern.EMAIL)]],
      password: ['', Validators.required],
    });

    // This will trigger change detection automatically when the form's status changes
    this.loginForm.statusChanges.pipe(takeUntil(this.destroy$)).subscribe();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.accountService.login(this.loginForm.value)
      .pipe(
        switchMap(user => {
          if (user) {
            return this.authorizationService.isCurrentUserAuthorized(PolicyNames.RequireAtLeastAdminPanelViewerRole, user.role)
              .pipe(
                map(isAllowed => ({ user, isAllowed }))
              );
          } else {
            // Handle login failure...
            return of(null);
          }
        })
      )
      .subscribe({
        next: (result) => {
          if (result) {
            if (result.isAllowed) {
              this.router.navigateByUrl('admin');
            } else {
              this.router.navigateByUrl(this.returnUrl());
            }
          }
        },
        error: (err) => {
          console.error("Submit failed!", err);
        }
      });
  }
}
