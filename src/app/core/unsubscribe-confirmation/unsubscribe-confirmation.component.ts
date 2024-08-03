import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-unsubscribe-confirmation',
  standalone: true,
  imports: [],
  templateUrl: './unsubscribe-confirmation.component.html',
  styleUrl: './unsubscribe-confirmation.component.scss'
})
export class UnsubscribeConfirmationComponent {
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
