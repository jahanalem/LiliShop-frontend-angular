
import { BehaviorSubject, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Component, OnInit, OnDestroy, DoCheck } from '@angular/core';
import { IUser } from 'src/app/shared/models/user';
import { BasketService } from '../../../core/services/basket.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { PolicyNames } from 'src/app/shared/models/policy';


@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit, OnDestroy, DoCheck {
  public isCollapsed = true;
  basket$ = this.basketService.basket$;
  private currentUserSource = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSource.asObservable();

  hasAccessToAdminPanel$: Observable<boolean> = this.currentUserSource.pipe(
    switchMap(user => {
      if (user) {
        return this.authorizationService
          .isCurrentUserAuthorized(PolicyNames.RequireAtLeastAdminPanelViewerRole, user.role)
          .pipe(tap((isAuth) => console.log("hasAccessToAdminPanel = ", isAuth)));
      } else {
        return of(false).pipe(tap((isAuth) => console.log("hasAccessToAdminPanel > false = ", isAuth)));
      }
    })
  );

  private destroy$ = new Subject<void>();

  constructor(private basketService: BasketService, private accountService: AccountService, private authorizationService: AuthorizationService) {
    console.log("constructor - navbar");
  }
  ngDoCheck(): void {
    console.log("ngDoCheck - navbar");
  }

  ngOnInit(): void {
    console.log("ngOnInit - navbar");

    this.accountService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currentUser => this.currentUserSource.next(currentUser));
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

