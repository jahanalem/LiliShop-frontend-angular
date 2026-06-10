import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { catchError, of, tap } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { IAddress } from 'src/app/shared/models/address';
import { IBasketTotals } from 'src/app/shared/models/basket';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { MatStepperModule } from '@angular/material/stepper';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonModule } from '@angular/common';
import { CheckoutAddressComponent } from './checkout-address/checkout-address.component';
import { CheckoutDeliveryComponent } from './checkout-delivery/checkout-delivery.component';
import { CheckoutReviewComponent } from './checkout-review/checkout-review.component';
import { CheckoutPaymentComponent } from './checkout-payment/checkout-payment.component';

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CheckoutData {
  address: CheckoutAddress;
  delivery: { deliveryMethod: number | null };
  payment: { nameOnCard: string };
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatStepperModule,
    SharedModule,
    CommonModule,
    CheckoutAddressComponent,
    CheckoutDeliveryComponent,
    CheckoutReviewComponent,
    CheckoutPaymentComponent
  ]
})
export class CheckoutComponent implements OnInit {
  basketTotals = signal<IBasketTotals | null>(null);

  private accountService = inject(AccountService);
  private basketService = inject(BasketService);

  // The whole checkout is one signal model; its shape is the form's shape.
  readonly checkoutModel = signal<CheckoutData>({
    address: { firstName: '', lastName: '', street: '', city: '', state: '', zipCode: '' },
    delivery: { deliveryMethod: null },
    payment: { nameOnCard: '' },
  });

  readonly checkoutForm = form(this.checkoutModel, (path) => {
    required(path.address.firstName, { message: 'First name is required' });
    required(path.address.lastName, { message: 'Last name is required' });
    required(path.address.street, { message: 'Street is required' });
    required(path.address.city, { message: 'City is required' });
    required(path.address.state, { message: 'State is required' });
    required(path.address.zipCode, { message: 'Zip code is required' });

    required(path.delivery.deliveryMethod, { message: 'Please choose a delivery method' });

    required(path.payment.nameOnCard, { message: 'Name on card is required' });
  });

  ngOnInit(): void {
    this.loadUserAddress();
    this.loadDeliveryMethodValue();
    this.basketService.basketTotal$.subscribe((totals) => this.basketTotals.set(totals));
  }

  private loadUserAddress(): void {
    this.accountService
      .getUserAddress()
      .pipe(
        tap((address: IAddress) => {
          if (address) {
            // Map explicit fields only, so unknown server keys don't leak into the model.
            this.checkoutModel.update((m) => ({
              ...m,
              address: {
                firstName: address.firstName ?? '',
                lastName: address.lastName ?? '',
                street: address.street ?? '',
                city: address.city ?? '',
                state: address.state ?? '',
                zipCode: address.zipCode ?? '',
              },
            }));
          }
        }),
        catchError((error: any) => {
          console.error(error);
          return of();
        }),
      )
      .subscribe();
  }

  private loadDeliveryMethodValue(): void {
    const basket = this.basketService.getCurrentBasketValue();
    if (basket?.deliveryMethodId != null) {
      this.checkoutModel.update((m) => ({
        ...m,
        delivery: { deliveryMethod: basket.deliveryMethodId! },
      }));
    }
  }

  /** Called by the delivery child; the parent owns the model and writes the choice. */
  onDeliveryMethodSelected(method: IDeliveryMethod): void {
    this.checkoutModel.update((m) => ({
      ...m,
      delivery: { deliveryMethod: method.id },
    }));
  }
}

/**
 * The exact type of the checkout form tree, inferred from `form()` above.
 * Children take this so that `checkoutForm().address.firstName` navigation
 * type-checks — a hand-written `Field<CheckoutData>` does not expose child fields.
 */
export type CheckoutForm = CheckoutComponent['checkoutForm'];
