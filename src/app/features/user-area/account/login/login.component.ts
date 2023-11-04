
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { pattern } from 'src/app/shared/constants/patterns';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { map, of, switchMap } from 'rxjs';
import { PolicyNames } from 'src/app/shared/models/policy';



/* sample form: https://mdbootstrap.com/docs/standard/extended/login/ */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  returnUrl: string = '/';

  constructor(private accountService: AccountService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private authorizationService: AuthorizationService) { }

  ngOnInit(): void {
    this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || '/shop';
    this.createLoginForm();
  }

  createLoginForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(pattern.EMAIL)]],
      password: ['', Validators.required],
    });
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
              this.router.navigateByUrl(this.returnUrl);
            }
          }
        },
        error: (err) => {
          console.error("Submit failed!", err);
        }
      });
  }
}
