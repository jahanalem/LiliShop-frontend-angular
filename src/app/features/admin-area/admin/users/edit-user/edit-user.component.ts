import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AccountService } from 'src/app/core/services/account.service';
import { RoleService } from 'src/app/core/services/role.service';
import { IAdminAreaUser } from 'src/app/shared/models/adminAreaUser';
import { IRole } from 'src/app/shared/models/role';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {
  adminUserForm!: FormGroup;
  adminUser: IAdminAreaUser | null = null;
  userIdFromUrl: number = 0;
  roles: IRole[] = [];

  constructor(
    private accountService: AccountService,
    private roleService: RoleService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.getRoles();
    this.getUser();
    this.createAdminUserForm();
  }

  createAdminUserForm() {
    this.adminUserForm = this.formBuilder.group({
      email: [{ value: null, disabled: true }, [Validators.required, Validators.email]],
      displayName: [null, Validators.required],
      roleId: [null, Validators.required],
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
        })
      }
    })
  }

  getRoles() {
    this.roleService.getRoles().subscribe({
      next: (roles) => { this.roles = roles; },
      error: (error) => { console.error(error) }
    });
  }

  updateAdminUserForm(user: IAdminAreaUser) {
    this.adminUserForm.patchValue({
      email: user.email,
      displayName: user.displayName,
      roleId: user.roleId,
      emailConfirmed: user.emailConfirmed,
      phoneNumber: user.phoneNumber,
      phoneNumberConfirmed: user.phoneNumberConfirmed,
      lockoutEnabled: user.lockoutEnabled,
      id: user.id,
      lockoutEnd: user.lockoutEnd,
      accessFailedCount: user.accessFailedCount
    });
    //this.adminUserForm.get('roleName')?.setValue(user.roleId);
  }

  onSubmit() {

  }

  navigateBack() {
    this.router.navigateByUrl('/admin/users');
  }
}
