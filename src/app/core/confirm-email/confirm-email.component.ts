import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmEmailComponent implements OnInit {
  success = signal<boolean | null>(null);
  email   = signal<string | null>(null);

  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  constructor() { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.success.set(params['success'] === 'true');
      this.email.set(params['email']);
      this.cdr.markForCheck();
    });
  }

  redirectToHome() {
    this.router.navigateByUrl('/');
  }
}
