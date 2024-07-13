
import { Observable, of, startWith, Subject, switchMap, takeUntil } from 'rxjs';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { BasketService } from '../../../core/services/basket.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { PolicyNames } from 'src/app/shared/models/policy';
import { IUser } from '../../models/user';
import { IBasket } from '../../models/basket';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavBarComponent implements OnInit, OnDestroy {
  public  cdr                  = inject(ChangeDetectorRef);
  private basketService        = inject(BasketService);
  private accountService       = inject(AccountService);
  private authorizationService = inject(AuthorizationService);
  private ngZone               = inject(NgZone);

  basket$      : Observable<IBasket | null> = this.basketService.basket$;
  currentUser$: Observable<IUser | null>    = this.accountService.currentUser$;
  destroy$    : Subject<void>               = new Subject<void>();

  hasAccessToAdminPanel = signal<boolean>(false);
  isCollapsed           = signal<boolean>(true);

  constructor() {
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
      this.ngZone.run(() => {
        this.hasAccessToAdminPanel.set(isAdmin);
        this.cdr.detectChanges();
      });
    });

  }

  toggleCollapse() {
    this.isCollapsed.set(!this.isCollapsed());
  }

  logout() {
    this.accountService.logout();
  }
}

