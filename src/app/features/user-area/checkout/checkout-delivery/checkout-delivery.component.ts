
import { FormGroup } from '@angular/forms';
import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { Subject } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { Router } from '@angular/router';


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
  private accountService = inject(AccountService);
  private router = inject(Router);
  private basketService = inject(BasketService);

  constructor() {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.loadDeliveryMethods();
  }

  loadDeliveryMethods() {
    if (!this.accountService.isLoggedIn()) {
      console.error('User is not authenticated. Redirecting to login.');
      this.router.navigate(['/account/login']);
      return;
    }

    this.checkoutService.getDeliveryMethods().subscribe({
      next: (methods) => {
        if (methods.length === 0) {
          console.warn('No delivery methods available.');
        } else {
          this.deliveryMethods.set(methods);
        }
      },
      error: (error) => {
        console.error('Failed to load delivery methods:', error);
      }
    });
  }

  setShippingPrice(deliveryMethod: IDeliveryMethod) {
    this.basketService.setShippingPrice(deliveryMethod);
  }
}
