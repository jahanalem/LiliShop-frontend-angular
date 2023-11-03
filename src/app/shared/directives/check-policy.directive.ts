import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { Subject, takeUntil, tap } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';

@Directive({
  selector: '[appCheckPolicy]'
})
export class CheckPolicyDirective implements OnInit, OnDestroy {
  @Input() appCheckPolicy!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private authorizationService: AuthorizationService,
    private accountService: AccountService,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

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
    this.authorizationService.isRoleAllowedInPolicy(role, this.appCheckPolicy)
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAllowed => {
        const icon = this.el.nativeElement.querySelector('mat-icon');
        if (icon) {
          if (isAllowed) {
            this.renderer.removeClass(icon, 'icon-disabled');
            this.el.nativeElement.disabled = false;
          } else {
            this.renderer.addClass(icon, 'icon-disabled');
            this.el.nativeElement.disabled = true;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
