
import { FormGroup } from '@angular/forms';
import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { Subject, catchError, of, takeUntil, tap } from 'rxjs';


@Component({
    selector: 'app-checkout-delivery',
    templateUrl: './checkout-delivery.component.html',
    styleUrls: ['./checkout-delivery.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CheckoutDeliveryComponent implements OnInit, OnDestroy {
  checkoutForm = input.required<FormGroup>();

  deliveryMethods = signal<IDeliveryMethod[]>([]);

  private destroy$ = new Subject<void>();

  private checkoutService = inject(CheckoutService);
  private basketService   = inject(BasketService);

  constructor() {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.checkoutService.getDeliveryMethods().pipe(
      takeUntil(this.destroy$),
      tap((dm: IDeliveryMethod[]) => {
        this.deliveryMethods.set(dm);
      }),
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
