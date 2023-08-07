
import { FormGroup } from '@angular/forms';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { Subscription, catchError, of, tap } from 'rxjs';


@Component({
  selector: 'app-checkout-delivery',
  templateUrl: './checkout-delivery.component.html',
  styleUrls: ['./checkout-delivery.component.scss']
})
export class CheckoutDeliveryComponent implements OnInit, OnDestroy {
  @Input() checkoutForm!: FormGroup;
  deliveryMethods: IDeliveryMethod[] = [];
  private subscription!: Subscription;

  constructor(private checkoutService: CheckoutService, private basketService: BasketService) { }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.checkoutService.getDeliveryMethods().pipe(
      tap((dm: IDeliveryMethod[]) => this.deliveryMethods = dm),
      catchError((error: any) => {
        console.error(error);
        return of();
      })
    ).subscribe();
  }

  setShippingPrice(deliveryMethod: IDeliveryMethod) {
    this.basketService.setShippingPrice(deliveryMethod);
  }
}
