import { ToastrService } from 'ngx-toastr';
import { FormGroup } from '@angular/forms';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnDestroy} from '@angular/core';
import { IAddress } from 'src/app/shared/models/address';
import { AccountService } from 'src/app/core/services/account.service';
import { Subscription, catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-checkout-address',
  templateUrl: './checkout-address.component.html',
  styleUrls: ['./checkout-address.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutAddressComponent implements OnDestroy, AfterViewInit {
  checkoutForm = input.required<FormGroup>();
  private subscription!: Subscription;

  constructor(private accountService: AccountService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef) { }
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  saveUserAddress() {
    const addressForm = this.checkoutForm()?.get('addressForm');
    if (addressForm) {
      this.subscription = this.accountService.updateAddress(addressForm.value)
        .pipe(
          tap((address: IAddress) => {
            this.toastr.success('Address saved.');
            this.checkoutForm()?.get('addressForm')?.reset(address);
            this.cdr.markForCheck();
          }),
          catchError((error: any) => {
            this.toastr.error(error.message);
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

  isActivatedGoToDeliveryButton(){
    const result = this.checkoutForm().get('addressForm')?.invalid;
    this.cdr.markForCheck();
    return result;
  }
}
