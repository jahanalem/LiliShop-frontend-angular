import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
    selector: 'app-unsubscribe-confirmation',
    imports: [TranslatePipe, ],
    templateUrl: './unsubscribe-confirmation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './unsubscribe-confirmation.component.scss'
})
export class UnsubscribeConfirmationComponent {
  protected readonly TranslationKeys = TranslationKeys;

  success = signal<boolean | null>(null);

  private destroy$ = new Subject<void>();

  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.success.set(params['success'] === 'true');
    });
  }

  redirectToHome() {
    this.router.navigateByUrl('/');
  }
}
