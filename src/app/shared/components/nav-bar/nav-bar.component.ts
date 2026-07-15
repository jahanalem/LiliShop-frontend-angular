import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';

import { Observable, of, startWith, Subject, switchMap, takeUntil } from 'rxjs';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { BasketService } from '../../../core/services/basket.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { PolicyNames } from 'src/app/shared/models/policy';
import { IUser } from '../../models/user';
import { IBasket } from '../../models/basket';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LOCAL_STORAGE_KEYS } from '../../constants/auth';
import { StorageService } from 'src/app/core/services/storage.service';
import { Router } from '@angular/router';
import { BusyService } from 'src/app/core/services/busy.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';
import { TranslationService } from 'src/app/core/i18n/translation.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    RouterModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatListModule,
    MatSidenavModule,
    MatProgressBarModule,
    LanguageSwitcherComponent,
    TranslatePipe
  ]
})
export class NavBarComponent implements OnInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  basket$     : Observable<IBasket | null>;
  currentUser$: Observable<IUser | null>;
  readonly sidenav = viewChild.required<MatSidenav>('sidenav');
  hasAccessToAdminPanel = signal<boolean>(false);

  destroy$: Subject<void> = new Subject<void>();

  private authorizationService = inject(AuthorizationService);
  private accountService       = inject(AccountService);
  private storageService       = inject(StorageService);
  private basketService        = inject(BasketService);
  private snackBar             = inject(MatSnackBar);
  private router               = inject(Router);
  private translationService   = inject(TranslationService);
  protected busyService        = inject(BusyService);
  protected themeService       = inject(ThemeService);

  constructor() {
    this.basket$      = this.basketService.basket$;
    this.currentUser$ = this.accountService.currentUser$;
  }

  ngOnInit(): void {
    this.initializeAdminAccess();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeAdminAccess(): void {
    this.currentUser$.pipe(
      takeUntil(this.destroy$),
      switchMap(user => {
        if (user) {
          return this.authorizationService.isCurrentUserAuthorized(PolicyNames.RequireAtLeastAdminPanelViewerRole, user.role);
        }
        return of(false);
      }),
      startWith(false)
    ).subscribe(isAdmin => {
        this.hasAccessToAdminPanel.set(isAdmin);
    });
  }

  toggleSidenav() {
    this.sidenav().toggle();
  }

  closeSidenav() {
    this.sidenav().close();
  }

  logout() {
    this.accountService.logout();
  }

  logoutFromAllDevices() {
    if (confirm(this.translationService.translate(TranslationKeys.Nav.LogoutAllConfirm))) {
      this.accountService.logoutFromAllDevices().subscribe({
        next: () => {
          this.snackBar.open(
            this.translationService.translate(TranslationKeys.Auth.LoggedOutAll),
            this.translationService.translate(TranslationKeys.Common.Close), {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.storageService.delete(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
          this.router.navigateByUrl('/account/login');
        },
        error: (error) => {
          this.snackBar.open(
            this.translationService.translate(TranslationKeys.Auth.LogoutAllFailed),
            this.translationService.translate(TranslationKeys.Common.Close), {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          console.error('Logout error:', error);
        }
      });
    }
  }
}
