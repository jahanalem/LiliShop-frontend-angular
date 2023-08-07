import { CdkStepper } from '@angular/cdk/stepper';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { BasketService } from 'src/app/core/services/basket.service';

import { IBasket } from 'src/app/shared/models/basket';

@Component({
  selector: 'app-checkout-review',
  templateUrl: './checkout-review.component.html',
  styleUrls: ['./checkout-review.component.scss']
})
export class CheckoutReviewComponent implements OnInit, OnDestroy {
  @Input() appStepper!: CdkStepper;
  basket$: Observable<IBasket | null> = of(null);
  private subscription: Subscription = new Subscription();

  constructor(private basketService: BasketService) { }

  ngOnInit(): void {
    this.basket$ = this.basketService.basket$;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  createPaymentIntent() {
    const paymentIntentSubscription = this.basketService.createPaymentIntent().subscribe(
      {
        next: () => { this.appStepper.next(); },
        error: error => { console.log(error); }
      });

    this.subscription.add(paymentIntentSubscription);
  }
}
