import { FormGroup } from '@angular/forms';
import { ChangeDetectionStrategy, Component, inject, input, OnDestroy } from '@angular/core';
import { IAddress } from 'src/app/shared/models/address';
import { AccountService } from 'src/app/core/services/account.service';
import { Subject, catchError, of, takeUntil, tap } from 'rxjs';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
    selector: 'app-checkout-address',
    templateUrl: './checkout-address.component.html',
    styleUrls: ['./checkout-address.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CheckoutAddressComponent implements OnDestroy {
  checkoutForm = input.required<FormGroup>();

  destroy$ = new Subject<void>();

  private accountService      = inject(AccountService);
  private notificationService = inject(NotificationService);

  constructor() {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveUserAddress() {
    const addressForm = this.checkoutForm()?.get('addressForm');
    if (addressForm) {
      this.accountService.updateAddress(addressForm.value)
        .pipe(
          takeUntil(this.destroy$),
          tap((address: IAddress) => {
            this.notificationService.showSuccess('Address saved.');
            this.checkoutForm()?.get('addressForm')?.reset(address);
          }),
          catchError((error: any) => {
            this.notificationService.showError(error.message);
            console.error(error);
            return of();
          })
        )
        .subscribe();
    }
    else {
      console.warn('Address form group is missing!');
    }
  }

  isActivatedGoToDeliveryButton() {
    const result = this.checkoutForm().get('addressForm')?.invalid;
    return result;
  }
}
