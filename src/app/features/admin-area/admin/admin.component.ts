import { AccountService } from 'src/app/core/services/account.service';
import { Component, OnDestroy, ChangeDetectionStrategy, viewChild, inject, AfterViewInit, OnInit } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { delay, filter, Subject, takeUntil } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BusyService } from 'src/app/core/services/busy.service';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatDividerModule } from "@angular/material/divider";
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

  @Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
      RouterModule,
      MatToolbarModule,
      MatIconModule,
      MatMenuModule,
      MatProgressBarModule,
      MatSidenavModule,
      MatDividerModule,
      MatListModule,
      MatButtonModule,
      TranslatePipe
    ]
})
export default class AdminComponent implements OnDestroy, AfterViewInit, OnInit {
  sidenav = viewChild.required<MatSidenav>(MatSidenav);

  private destroy$       = new Subject<void>();

  private observer       = inject(BreakpointObserver);
  private router         = inject(Router);
  private accountService = inject(AccountService);
  protected busyService  = inject(BusyService);

  protected readonly TranslationKeys = TranslationKeys;

  // Labels are translation keys — the sidenav renders them through the translate pipe.
  navItems = [
    { name: TranslationKeys.Admin.Nav.Dashboard, link: '/admin',                     icon: 'dashboard' },
    { name: TranslationKeys.Admin.Nav.Products,  link: '/admin/products',            icon: 'storefront' },
    { name: TranslationKeys.Admin.Nav.Brands,    link: '/admin/brands',              icon: 'verified' },
    { name: TranslationKeys.Admin.Nav.Types,     link: '/admin/product-types',       icon: 'category' },
    { name: TranslationKeys.Admin.Nav.Messages,  link: '/admin/contact-us-messages', icon: 'message' },
    { name: TranslationKeys.Admin.Nav.Discounts, link: '/admin/discounts',           icon: 'price_check'},
    { name: TranslationKeys.Admin.Nav.Users,     link: '/admin/users',               icon: 'supervisor_account' },
    { name: TranslationKeys.Nav.PriceAlerts, link: '/admin/subscribers/drop-price', icon: 'price_change' },
    { name: TranslationKeys.Admin.Nav.Translations, link: '/admin/translations',     icon: 'translate' },
    { name: TranslationKeys.Admin.Nav.Languages,    link: '/admin/languages',        icon: 'language' },
    { name: TranslationKeys.Admin.Nav.Printess, link: '/admin/printess-editor', icon: 'draw' },
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
