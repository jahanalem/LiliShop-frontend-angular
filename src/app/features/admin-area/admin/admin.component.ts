import { AccountService } from 'src/app/core/services/account.service';
import { Component, OnDestroy, ChangeDetectionStrategy, viewChild, inject, AfterViewInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { delay, filter, Subject, takeUntil } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class AdminComponent implements OnDestroy, AfterViewInit {
  sidenav = viewChild.required<MatSidenav>(MatSidenav);

  private destroy$       = new Subject<void>();

  private observer       = inject(BreakpointObserver);
  private router         = inject(Router);
  private accountService = inject(AccountService);

  navItems = [
    { name: 'Dashboard', link: '/admin',                     icon: 'dashboard' },
    { name: 'Products',  link: '/admin/products',            icon: 'library_books' },
    { name: 'Brands',    link: '/admin/brands',              icon: 'branding_watermark' },
    { name: 'Types',     link: '/admin/product-types',       icon: 'category' },
    { name: 'Messages',  link: '/admin/contact-us-messages', icon: 'message' },
    { name: 'Users',     link: '/admin/users',               icon: 'supervisor_account' },
  ];

  constructor() {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.observer
      .observe(['(max-width: 800px)'])
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
        if (this.sidenav().mode === 'over') {
          this.setSidenav(false);
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
