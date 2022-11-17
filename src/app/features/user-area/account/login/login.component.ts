import { PERMISSION_KIND, PERMISSION_NAME } from 'src/app/shared/constants/auth';
import { IUser } from 'src/app/shared/models/user';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { pattern } from 'src/app/shared/constants/patterns';
import { AccountService } from 'src/app/core/services/account.service';

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
    private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || '/shop';
    this.createLoginForm();
  }

  createLoginForm() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.pattern(pattern.EMAIL)]),
      password: new FormControl('', Validators.required),
    });
  }

  onSubmit() {
    this.accountService.login(this.loginForm.value).subscribe(() => {
      this.accountService.currentUser$.subscribe((user: IUser | null) => {
        if (user) {
          console.log(PERMISSION_KIND[PERMISSION_NAME.PRIVATE_ACCESS]);
          if (PERMISSION_KIND[PERMISSION_NAME.PRIVATE_ACCESS].includes(user.role)) {
            this.router.navigateByUrl('admin');
          }
          else {
            this.router.navigateByUrl(this.returnUrl);
          }
        }
      });
    }, () => { console.log("Submit failed!"); })
  }
}
