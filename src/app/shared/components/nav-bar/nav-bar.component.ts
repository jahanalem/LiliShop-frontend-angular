
import { Observable, of, switchMap } from 'rxjs';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { BasketService } from '../../../core/services/basket.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { PolicyNames } from 'src/app/shared/models/policy';


@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavBarComponent implements OnInit {
  isCollapsed  = signal<boolean>(true);
  basket$      = this.basketService.basket$;
  currentUser$ = this.accountService.currentUser$;

  hasAccessToAdminPanel$: Observable<boolean> = of(false);

  constructor(
    private basketService: BasketService,
    private accountService: AccountService,
    private authorizationService: AuthorizationService) {
  }

  ngOnInit(): void {
    this.hasAccessToAdminPanel$ = this.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.authorizationService.isCurrentUserAuthorized(
            PolicyNames.RequireAtLeastAdminPanelViewerRole, user.role
          );
        }
        return of(false);
      })
    );
  }

  toggleCollapse() {
    this.isCollapsed.set(!this.isCollapsed());
  }

  logout() {
    this.accountService.logout();
  }
}

