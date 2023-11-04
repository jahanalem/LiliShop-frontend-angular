
import { BehaviorSubject, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IUser } from 'src/app/shared/models/user';
import { BasketService } from '../services/basket.service';
import { AccountService } from '../services/account.service';
import { AuthorizationService } from '../services/authorization.service';
import { PolicyNames } from 'src/app/shared/models/policy';


@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit, OnDestroy {
  public isCollapsed = true;
  basket$ = this.basketService.basket$;
  private currentUserSource = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSource.asObservable();
  hasAccessToAdminPanel$: Observable<boolean> = of(false);
  private destroy$ = new Subject<void>();

  constructor(private basketService: BasketService, private accountService: AccountService, private authorizationService: AuthorizationService) {
    this.accountService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currentUser => this.currentUserSource.next(currentUser));
  }

  ngOnInit(): void {
    this.hasAccessToAdminPanel$ = this.currentUserSource.pipe(
      switchMap(user => {
        if (user) {
          return this.authorizationService.isCurrentUserAuthorized(PolicyNames.RequireAtLeastAdminPanelViewerRole, user.role);
        } else {
          return of(false);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.accountService.logout();
  }
}

