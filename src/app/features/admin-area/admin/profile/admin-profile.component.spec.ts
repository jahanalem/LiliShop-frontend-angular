import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AdminProfileComponent } from './admin-profile.component';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { NotificationService } from 'src/app/core/services/notification.service';

describe('AdminProfileComponent', () => {
  let fixture: ComponentFixture<AdminProfileComponent>;
  let component: AdminProfileComponent;
  let accountService: AccountService;
  let notificationService: NotificationService;
  let dialog: MatDialog;

  beforeEach(async () => {
    const accountServiceMock = {
      resetAuthenticator: vi.fn().mockName('AccountService.resetAuthenticator'),
      logout: vi.fn().mockName('AccountService.logout'),
    };
    const authorizationServiceMock = {
      isCurrentUserAuthorized: vi.fn().mockReturnValue(of(true)),
    };
    const notificationServiceMock = {
      showSuccess: vi.fn().mockName('NotificationService.showSuccess'),
      showError: vi.fn().mockName('NotificationService.showError'),
    };
    const dialogMock = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(true) }),
    };

    await TestBed.configureTestingModule({
      imports: [AdminProfileComponent],
      providers: [
        { provide: AccountService, useValue: accountServiceMock },
        { provide: AuthorizationService, useValue: authorizationServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        provideNoopAnimations(),
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProfileComponent);
    component = fixture.componentInstance;
    accountService = TestBed.inject(AccountService);
    notificationService = TestBed.inject(NotificationService);
    dialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
  });

  it('should create and show the MFA card for administrators', () => {
    expect(component).toBeTruthy();
    expect(component.canResetMfa()).toBe(true);
    expect(fixture.nativeElement.querySelector('.security-card')).toBeTruthy();
  });

  it('requires the current password before asking the backend', () => {
    component.password.set('   ');
    component.resetMfa();

    expect(component.serverError()).toBeTruthy();
    expect(dialog.open).not.toHaveBeenCalled();
    expect(accountService.resetAuthenticator).not.toHaveBeenCalled();
  });

  it('resets MFA after confirmation and signs the user out', () => {
    (accountService.resetAuthenticator as Mock).mockReturnValue(of({ message: 'done' }));

    component.password.set('P@ssw0rd');
    component.resetMfa();

    expect(dialog.open).toHaveBeenCalled();
    expect(accountService.resetAuthenticator).toHaveBeenCalledWith('P@ssw0rd');
    expect(notificationService.showSuccess).toHaveBeenCalledWith('done');
    expect(accountService.logout).toHaveBeenCalled();
  });

  it('does nothing when the confirmation dialog is dismissed', () => {
    (dialog.open as Mock).mockReturnValue({ afterClosed: () => of(false) });

    component.password.set('P@ssw0rd');
    component.resetMfa();

    expect(accountService.resetAuthenticator).not.toHaveBeenCalled();
  });

  it('surfaces the backend error message when the reset fails', () => {
    (accountService.resetAuthenticator as Mock).mockReturnValue(
      throwError(() => ({ error: { detail: 'The password provided is invalid.' } })));

    component.password.set('wrong');
    component.resetMfa();

    expect(component.serverError()).toBe('The password provided is invalid.');
    expect(accountService.logout).not.toHaveBeenCalled();
  });
});
