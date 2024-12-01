import { Directive, ElementRef, HostBinding, inject, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { Subject, takeUntil, tap } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { PolicyNames } from '../models/policy';

@Directive({
    selector: '[appCheckPolicy]',
    standalone: false
})
export class CheckPolicyDirective implements OnInit, OnDestroy {
  @Input() appCheckPolicy!: PolicyNames;
  @HostBinding('attr.disabled') isDisabled: boolean | null = null;

  private destroy$ = new Subject<void>();

  private authorizationService = inject(AuthorizationService);
  private accountService       = inject(AccountService);
  private el                   = inject(ElementRef);
  private renderer             = inject(Renderer2);

  constructor() { }

  ngOnInit(): void {
    this.accountService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        tap(user => {
          if (user && this.appCheckPolicy) {
            this.updateVisibility(user.role);
          }
        })
      )
      .subscribe();
  }

  private updateVisibility(role: string): void {
    this.authorizationService.isCurrentUserAuthorized(this.appCheckPolicy, role)
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAllowed => {
        const icon = this.el.nativeElement.querySelector('mat-icon');
        if (icon) {
          if (isAllowed) {
            this.renderer.removeClass(icon, 'icon-disabled');
            this.isDisabled = null;
          } else {
            this.renderer.addClass(icon, 'icon-disabled');
            this.isDisabled = true;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
