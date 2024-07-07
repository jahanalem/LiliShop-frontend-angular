
import { FormGroup } from '@angular/forms';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnDestroy, OnInit, signal } from '@angular/core';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { Subscription, catchError, of, tap } from 'rxjs';


@Component({
  selector: 'app-checkout-delivery',
  templateUrl: './checkout-delivery.component.html',
  styleUrls: ['./checkout-delivery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutDeliveryComponent implements OnInit, OnDestroy {
  checkoutForm = input.required<FormGroup>();
  deliveryMethods = signal<IDeliveryMethod[]>([]);
  private subscription!: Subscription;

  constructor(
    private checkoutService: CheckoutService,
    private basketService: BasketService,
    private cdr: ChangeDetectorRef) { }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.checkoutService.getDeliveryMethods().pipe(
      tap((dm: IDeliveryMethod[]) => {
        this.deliveryMethods.set(dm);
        this.cdr.markForCheck();
      }),
      catchError((error: any) => {
        console.error(error);
        return of();
      })
    ).subscribe();
  }

  setShippingPrice(deliveryMethod: IDeliveryMethod) {
    this.basketService.setShippingPrice(deliveryMethod);
    this.cdr.markForCheck();
  }
}
