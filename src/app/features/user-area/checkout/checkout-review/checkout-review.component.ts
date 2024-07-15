import { IDialogData } from './../../../../shared/models/dialog-data.interface';
import { CdkStepper } from '@angular/cdk/stepper';
import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, take, takeUntil } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';

import { IBasket } from 'src/app/shared/models/basket';
import { IUser } from 'src/app/shared/models/user';

@Component({
  selector: 'app-checkout-review',
  templateUrl: './checkout-review.component.html',
  styleUrls: ['./checkout-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutReviewComponent implements OnInit, OnDestroy {
  appStepper = input.required<CdkStepper>();
  basket     = signal<IBasket | null>(null);

  private destroy$ = new Subject<void>();

  private basketService  = inject(BasketService);
  private accountService = inject(AccountService);
  private dialog         = inject(MatDialog);

  constructor() { }

  ngOnInit(): void {
    this.basketService.basket$.subscribe(basket => {
      this.basket.set(basket);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createPaymentIntent() {
    this.accountService.getCurrentUser().subscribe(() => {
      this.accountService.currentUser$.pipe(take(1)).subscribe((user: IUser | null) => {
        if (user?.emailConfirmed) {
          this.basketService.createPaymentIntent().pipe(takeUntil(this.destroy$)).subscribe({
            next: () => { this.appStepper()?.next(); },
            error: error => {
              console.error(error);
              //TODO: Show a proper message to the user
            }
          });
        } else {
          const dialogData: IDialogData = {
            content: "Please confirm your email before continuing to shop.",
            title: "Email Confirmation Required",
            showConfirmationButtons: false
          };
          const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });
          dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe();
        }
      });
    });
  }
}
