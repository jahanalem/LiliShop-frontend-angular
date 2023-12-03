import { IDialogData } from './../../../../shared/models/dialog-data.interface';
import { CdkStepper } from '@angular/cdk/stepper';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription, of, take } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';

import { IBasket } from 'src/app/shared/models/basket';
import { IUser } from 'src/app/shared/models/user';

@Component({
  selector: 'app-checkout-review',
  templateUrl: './checkout-review.component.html',
  styleUrls: ['./checkout-review.component.scss']
})
export class CheckoutReviewComponent implements OnInit, OnDestroy {
  @Input() appStepper!: CdkStepper;
  basket$: Observable<IBasket | null> = of(null);
  private subscription: Subscription = new Subscription();

  constructor(private basketService: BasketService,
    private accountService: AccountService,
    private dialog: MatDialog) { }

  ngOnInit(): void {
    this.basket$ = this.basketService.basket$;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  createPaymentIntent() {
    this.accountService.getCurrentUser().subscribe(() => {
      this.accountService.currentUser$.pipe(take(1)).subscribe((user: IUser | null) => {
        if (user?.emailConfirmed) {
          const paymentIntentSubscription = this.basketService.createPaymentIntent().subscribe({
            next: () => { this.appStepper.next(); },
            error: error => {
              console.error(error);
              //TODO: Show a proper message to the user
            }
          });

          this.subscription.add(paymentIntentSubscription);
        } else {
          const dialogData: IDialogData = {
            content: "Please confirm your email before continuing to shop.",
            title: "Email Confirmation Required",
            showConfirmationButtons: false
          };
          const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });
          dialogRef.afterClosed().subscribe();
        }
      });
    });
  }
}
