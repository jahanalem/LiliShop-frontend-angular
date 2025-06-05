import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-confirm-email',
    imports: [],
    templateUrl: './confirm-email.component.html',
    styleUrl: './confirm-email.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmEmailComponent implements OnInit, OnDestroy {
  success = signal<boolean | null>(null);
  email   = signal<string | null>(null);

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
      this.email.set(params['email']);
    });
  }

  redirectToHome() {
    this.router.navigateByUrl('/');
  }
}
