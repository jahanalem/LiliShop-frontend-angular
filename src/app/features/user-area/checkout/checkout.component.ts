
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, of, tap } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { IAddress } from 'src/app/shared/models/address';
import { IBasketTotals } from 'src/app/shared/models/basket';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit {
  checkoutForm!: FormGroup;

  basketTotals = signal<IBasketTotals | null>(null);

  private fb             = inject(FormBuilder);
  private accountService = inject(AccountService);
  private basketService  = inject(BasketService);

  constructor() {

   }

  ngOnInit(): void {
    this.createCheckoutForm();
    this.getAddressFormValues();
    this.getDeliveryMethodValue();
    this.basketService.basketTotal$.subscribe(totals => {
      this.basketTotals.set(totals);
    });
  }

  createCheckoutForm() {
    this.checkoutForm = this.fb.group({
      addressForm: this.fb.group({
        firstName: [null, Validators.required],
        lastName : [null, Validators.required],
        street   : [null, Validators.required],
        city     : [null, Validators.required],
        state    : [null, Validators.required],
        zipCode  : [null, Validators.required],
      }),
      deliveryForm: this.fb.group({
        deliveryMethod: [null, Validators.required]
      }),
      paymentForm: this.fb.group({
        nameOnCard: [null, Validators.required]
      })
    });
  }

  getAddressFormValues() {
    const addressForm = this.checkoutForm.get('addressForm');
    if (!addressForm) {
      console.warn('Address form group is missing!');
      return;
    }

    this.accountService.getUserAddress().pipe(
      tap((address: IAddress) => {
        if (address) {
          addressForm.patchValue(address);
          this.checkoutForm?.get('addressForm')?.markAsDirty
          addressForm.updateValueAndValidity();
        }
      }),
      catchError((error: any) => {
        console.error(error);
        return of(); // This will ensure the observable stream is not broken due to an error.(Swallow the error and continue the observable stream)
      })
    ).subscribe();
  }

  getDeliveryMethodValue() {
    const basket = this.basketService.getCurrentBasketValue();
    if (basket?.deliveryMethodId !== null) {
      this.checkoutForm.get('deliveryForm')?.get('deliveryMethod')?.patchValue(basket?.deliveryMethodId?.toString());
    }
  }

}
