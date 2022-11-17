
import { IBasket } from './../../shared/models/basket';
import { Observable, of, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IUser } from 'src/app/shared/models/user';
import { BasketService } from '../services/basket.service';
import { AccountService } from '../services/account.service';
import { PERMISSION_KIND, PERMISSION_NAME } from 'src/app/shared/constants/auth';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit, OnDestroy {
  public isCollapsed = true;
  basket$: Observable<IBasket | null> = of(null);
  currentUser$: Observable<IUser | null> = of(null);
  subscription: Subscription | undefined;
  constructor(private basketService: BasketService, private accountService: AccountService) { }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.basket$ = this.basketService.basket$;
    this.currentUser$ = this.accountService.currentUser$;
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.accountService.logout();
  }

  hasAccessToAdminPanel(): boolean {
    let hasAccess = false;
    this.subscription = this.currentUser$.subscribe((user: IUser | null) => {
      if (!user) {
        hasAccess = false;
        return hasAccess;
      }
      if (PERMISSION_KIND[PERMISSION_NAME.PRIVATE_ACCESS].includes(user.role)) {
        hasAccess = true;
        return hasAccess;
      }
      hasAccess = false;
      return hasAccess;
    });
    return hasAccess;
  }
}
