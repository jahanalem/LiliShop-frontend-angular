
import { BehaviorSubject, map, Observable, Subject, takeUntil } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IUser } from 'src/app/shared/models/user';
import { BasketService } from '../services/basket.service';
import { AccountService } from '../services/account.service';
import { PERMISSION_LABELS, PERMISSIONS, ROLES } from 'src/app/shared/constants/auth';


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
  hasAccessToAdminPanel$: Observable<boolean> = this.currentUserSource.pipe(
    map(user => !!user && PERMISSIONS[PERMISSION_LABELS.PRIVATE_ACCESS].includes(user.role as ROLES))
  );
  private destroy$ = new Subject<void>();

  constructor(private basketService: BasketService, private accountService: AccountService) { }

  ngOnInit(): void {
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

