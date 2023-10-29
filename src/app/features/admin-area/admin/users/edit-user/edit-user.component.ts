import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AccountService } from 'src/app/core/services/account.service';
import { IAdminAreaUser } from 'src/app/shared/models/adminAreaUser';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {
  adminUserForm!: FormGroup;
  adminUser: IAdminAreaUser | null = null;
  userIdFromUrl: number = 0;

  // Read-only fields
  readonlyId!: number | null;
  readonlyLockoutEnd!: Date | null;
  readonlyAccessFailedCount!: number | null;

  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.getUser();
    this.createAdminUserForm();
  }

  createAdminUserForm() {
    this.adminUserForm = this.formBuilder.group({
      email: [{ value: null, disabled: true }, [Validators.required, Validators.email]],
      displayName: [null, Validators.required],
      roleName: [null, Validators.required],
      emailConfirmed: [false],
      phoneNumber: [null],
      phoneNumberConfirmed: [false],
      lockoutEnabled: [false],
      id: [{ value: null, disabled: true }],
      lockoutEnd: [{ value: null, disabled: true }],
      accessFailedCount: [{ value: null, disabled: true }]
    })
  }

  getUser() {
    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      this.userIdFromUrl = id === null ? 0 : +id;
      if (this.userIdFromUrl && this.userIdFromUrl > 0) {
        this.accountService.getUser(this.userIdFromUrl).subscribe(response => {
          this.adminUser = response;
          this.updateAdminUserForm(response);

          // Initialize read-only fields
          this.readonlyId = response.id ?? null;
          this.readonlyLockoutEnd = response.lockoutEnd ?? null;
          this.readonlyAccessFailedCount = response.accessFailedCount ?? null;
        })
      }
    })
  }

  updateAdminUserForm(user: IAdminAreaUser) {
    this.adminUserForm.patchValue({
      email: user.email,
      displayName: user.displayName,
      roleName: user.roleName,
      emailConfirmed: user.emailConfirmed,
      phoneNumber: user.phoneNumber,
      phoneNumberConfirmed: user.phoneNumberConfirmed,
      lockoutEnabled: user.lockoutEnabled,
      id: user.id,
      lockoutEnd: user.lockoutEnd,
      accessFailedCount: user.accessFailedCount
    });
  }

  onSubmit() {

  }

  navigateBack() {
    this.router.navigateByUrl('/admin/users');
  }
}
