import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { RoleService } from 'src/app/core/services/role.service';
import { IAdminAreaUser } from 'src/app/shared/models/adminAreaUser';
import { IRole } from 'src/app/shared/models/role';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditUserComponent implements OnInit, OnDestroy {
  adminUserForm!: FormGroup;

  adminUser = signal<IAdminAreaUser | null>(null);
  roles     = signal<IRole[]>([]);

  userIdFromUrl: number = 0;

  private destroy$ = new Subject<void>();

  private accountService = inject(AccountService);
  private roleService    = inject(RoleService);
  private activatedRoute = inject(ActivatedRoute);
  private router         = inject(Router);
  private formBuilder    = inject(FormBuilder);

  constructor() {
    
  }

  ngOnInit(): void {
    this.getRoles();
    this.getUser();
    this.createAdminUserForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createAdminUserForm() {
    this.adminUserForm = this.formBuilder.group({
      email               : [{ value: null, disabled: true }, [Validators.required, Validators.email]],
      displayName         : [null, Validators.required],
      roleId              : [null, Validators.required],
      emailConfirmed      : [false],
      phoneNumber         : [null],
      phoneNumberConfirmed: [false],
      lockoutEnabled      : [false],
      id                  : [{ value: null, disabled: true }],
      lockoutEnd          : [{ value: null, disabled: true }],
      accessFailedCount   : [{ value: null, disabled: true }]
    })
  }

  getUser() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params: ParamMap) => {
      const id = params.get('id');
      this.userIdFromUrl = id === null ? 0 : +id;
      if (this.userIdFromUrl && this.userIdFromUrl > 0) {
        this.accountService.getUser(this.userIdFromUrl).subscribe(response => {
          this.adminUser.set(response);
          this.updateAdminUserForm(response);
        })
      }
    })
  }

  getRoles() {
    this.roleService.getRoles().subscribe({
      next: (roles) => { this.roles.set(roles); },
      error: (error) => { console.error(error) }
    });
  }

  updateAdminUserForm(user: IAdminAreaUser) {
    this.adminUserForm.patchValue({
      email               : user.email,
      displayName         : user.displayName,
      roleId              : user.roleId,
      emailConfirmed      : user.emailConfirmed,
      phoneNumber         : user.phoneNumber,
      phoneNumberConfirmed: user.phoneNumberConfirmed,
      lockoutEnabled      : user.lockoutEnabled,
      id                  : user.id,
      lockoutEnd          : user.lockoutEnd,
      accessFailedCount   : user.accessFailedCount
    });
  }

  onSubmit() {
    const user = this.adminUser(); // Ensure we're using the latest user info
    if (user) {
      const formValue = this.adminUserForm.value as IAdminAreaUser;
      const updatedRoleName = this.roles().find(r => r.id === formValue.roleId)?.name ?? "Standard";
      const userPayload = { ...user, ...formValue, roleName: updatedRoleName };

      this.accountService.updateUser(user.id!, userPayload).subscribe({
        next: () => console.log('User updated successfully.'),
        error: (error) => console.error('Error updating user:', error)
      });
    }
  }

  navigateBack() {
    this.router.navigateByUrl('/admin/users');
  }
}
