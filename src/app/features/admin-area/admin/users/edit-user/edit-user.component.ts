import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { RoleService } from 'src/app/core/services/role.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { IAdminAreaUser } from 'src/app/shared/models/adminAreaUser';
import { IRole } from 'src/app/shared/models/role';
import { PolicyNames } from 'src/app/shared/models/policy';

import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

@Component({
    selector: 'app-edit-user',
    templateUrl: './edit-user.component.html',
    styleUrls: ['./edit-user.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    TranslatePipe,RouterModule, MatSelectModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatIconModule, MatCheckboxModule, ReactiveFormsModule]
})
export class EditUserComponent implements OnInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  adminUserForm!: FormGroup;

  adminUser = signal<IAdminAreaUser | null>(null);
  roles     = signal<IRole[]>([]);

  userIdFromUrl: number = 0;

  /** True when the signed-in SuperAdmin may reset the DISPLAYED user's MFA (never the own account). */
  readonly canResetMfa = computed(() =>
    this.isSuperAdmin() && !!this.adminUser() && this.adminUser()!.id !== this.currentUserId());
  readonly resettingMfa = signal<boolean>(false);

  private readonly isSuperAdmin  = signal<boolean>(false);
  private readonly currentUserId = signal<number | null>(null);

  private destroy$ = new Subject<void>();

  private accountService       = inject(AccountService);
  private authorizationService = inject(AuthorizationService);
  private notificationService  = inject(NotificationService);
  private translationService   = inject(TranslationService);
  private roleService          = inject(RoleService);
  private activatedRoute       = inject(ActivatedRoute);
  private router               = inject(Router);
  private formBuilder          = inject(FormBuilder);
  private dialog               = inject(MatDialog);

  constructor() {

  }

  ngOnInit(): void {
    this.getRoles();
    this.getUser();
    this.createAdminUserForm();
    this.resolveMfaResetPermission();
  }

  private resolveMfaResetPermission(): void {
    combineLatest([
      this.authorizationService.isCurrentUserAuthorized(PolicyNames.RequireSuperAdminRole),
      this.accountService.currentUser$,
    ]).pipe(takeUntil(this.destroy$)).subscribe(([isSuperAdmin, currentUser]) => {
      this.isSuperAdmin.set(isSuperAdmin);
      this.currentUserId.set(currentUser?.id ?? null);
    });
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

  /**
   * Break-glass MFA recovery for the displayed user (see backend ResetAuthenticatorForUserAsync):
   * after confirmation, their authenticator secret and recovery codes are invalidated, every
   * session ends, and their next password sign-in restarts the standard MFA enrollment.
   */
  resetMfa(): void {
    const user = this.adminUser();
    if (!user?.id || this.resettingMfa()) {
      return;
    }

    const dialogData: IDialogData = {
      title: this.translationService.translate(TranslationKeys.Admin.Users.ResetMfaConfirmTitle),
      content: this.translationService.translate(TranslationKeys.Admin.Users.ResetMfaConfirmContent),
      showConfirmationButtons: true,
    };

    this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }

        this.resettingMfa.set(true);
        this.accountService.resetAuthenticatorForUser(user.id!).subscribe({
          next: () => {
            this.resettingMfa.set(false);
            this.notificationService.showSuccess(
              this.translationService.translate(TranslationKeys.Admin.Users.MfaResetDone));
          },
          error: (error) => {
            this.resettingMfa.set(false);
            this.notificationService.showError(error?.error?.detail || error?.error?.title
              || this.translationService.translate(TranslationKeys.Admin.Users.MfaResetFailed));
          },
        });
      });
  }
}