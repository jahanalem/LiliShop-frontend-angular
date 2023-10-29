
import { IUser } from 'src/app/shared/models/user';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { pattern } from 'src/app/shared/constants/patterns';
import { AccountService } from 'src/app/core/services/account.service';
import { PERMISSIONS, PERMISSION_LABELS, ROLES } from 'src/app/shared/constants/auth';


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
    private fb: FormBuilder) { }

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
      .subscribe({
        next: (user: IUser | null) => {
          if (user) {
            if (PERMISSIONS[PERMISSION_LABELS.PRIVATE_ACCESS].includes(user.role as ROLES)) {
              this.router.navigateByUrl('admin');
            } else {
              this.router.navigateByUrl(this.returnUrl);
            }
          }
        },
        error: (err) => {
          console.error("Submit failed!",err);
        }
      });
  }
}
