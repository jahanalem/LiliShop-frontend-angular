import { AccountService } from 'src/app/core/services/account.service';
import { Component, OnDestroy, ChangeDetectionStrategy, viewChild, inject, AfterViewInit, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { delay, filter, Subject, takeUntil } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BusyService } from 'src/app/core/services/busy.service';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export default class AdminComponent implements OnDestroy, AfterViewInit, OnInit {
  sidenav = viewChild.required<MatSidenav>(MatSidenav);

  private destroy$       = new Subject<void>();

  private observer       = inject(BreakpointObserver);
  private router         = inject(Router);
  private accountService = inject(AccountService);
  protected busyService  = inject(BusyService);

  navItems = [
    { name: 'Dashboard', link: '/admin',                     icon: 'dashboard' },
    { name: 'Products',  link: '/admin/products',            icon: 'storefront' },
    { name: 'Brands',    link: '/admin/brands',              icon: 'verified' },
    { name: 'Types',     link: '/admin/product-types',       icon: 'category' },
    { name: 'Messages',  link: '/admin/contact-us-messages', icon: 'message' },
    { name: 'Discounts', link: '/admin/discounts',           icon: 'price_check'},
    { name: 'Users',     link: '/admin/users',               icon: 'supervisor_account' },
    { name: 'Price Drop Alerts', link: '/admin/subscribers/drop-price', icon: 'price_change' },
    { name: 'Printess Editor', link: '/admin/printess-editor', icon: 'draw' },
  ];

  constructor() {
  }
  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.observer
      .observe(['(max-width: 992px)'])
      .pipe(takeUntil(this.destroy$), delay(1))
      .subscribe((res: { matches: boolean }) => {
        this.setSidenav(res.matches);
      });

    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((e) => e instanceof NavigationEnd)
      )
      .subscribe(() => {
        if (this.sidenav().mode === 'over' && this.sidenav().opened) {
          this.sidenav().close();
        }
      });
  }

  logout() {
    this.accountService.logout();
  }

  private setSidenav(matches: boolean) {
    if (matches) {
      this.sidenav().mode = 'over';
      this.sidenav().close();
    } else {
      this.sidenav().mode = 'side';
      this.sidenav().open();
    }
  }
}
