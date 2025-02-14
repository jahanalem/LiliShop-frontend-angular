import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { AccountService } from 'src/app/core/services/account.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { IPriceDropSubscription } from 'src/app/shared/models/priceDropSubscription';

@Component({
  selector: 'app-user-price-drop-subscriptions',
  imports: [CommonModule, MatProgressSpinnerModule, RouterLink, MatCardModule, MatTableModule, MatIcon],
  templateUrl: './user-price-drop-subscriptions.component.html',
  styleUrl: './user-price-drop-subscriptions.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPriceDropSubscriptionsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private accountService      = inject(AccountService);

  private userId = signal<number | null>(null);

  subscriptions = signal<IPriceDropSubscription[]>([]);
  isLoading     = signal<boolean>(false);

  displayedColumns: string[] = [
    'productName',
    'currentPrice',
    'oldPrice',
    'subscriptionDate',
    'action'
  ];

  constructor() {
    this.accountService.currentUser$.subscribe({
      next: (user) => {
        this.userId.set(user?.id ?? null);
      }
    });
  }

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.accountService.currentUser$.subscribe({
      next: (user) => {
        this.userId.set(user?.id ?? null);
      }
    });
    this.isLoading.set(true);
    const currentUserId = this.userId();
    if (currentUserId !== null) {
      this.notificationService.getUserSubscriptions(currentUserId)
        .subscribe({
          next: (subs) => {
            this.subscriptions.set(subs);
            this.isLoading.set(false);
          },
          error: (error: any) => {
            console.error('Error loading subscriptions', error);
            this.isLoading.set(false);
          }
        });
    }
  }

  unsubscribe(productId: number): void {
    this.notificationService.unsubscribe(this.userId()!, productId)
      .subscribe({
        next: () => {
          this.subscriptions.set(this.subscriptions().filter(s => s.productId !== productId));
        },
        error: (error: any) => {
          console.error('Error unsubscribing', error);
        }
      });
  }
}
