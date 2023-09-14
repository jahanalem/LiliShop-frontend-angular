import { ToastrService } from 'ngx-toastr';
import { FormGroup } from '@angular/forms';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IAddress } from 'src/app/shared/models/address';
import { AccountService } from 'src/app/core/services/account.service';
import { Subscription, catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-checkout-address',
  templateUrl: './checkout-address.component.html',
  styleUrls: ['./checkout-address.component.scss']
})
export class CheckoutAddressComponent implements OnInit, OnDestroy {
  @Input() checkoutForm!: FormGroup
  private subscription!: Subscription;

  constructor(private accountService: AccountService, private toastr: ToastrService) { }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnInit(): void {
  }

  saveUserAddress() {
    const addressForm = this.checkoutForm.get('addressForm');
    if (addressForm) {
      this.subscription = this.accountService.updateAddress(addressForm.value)
        .pipe(
          tap((address: IAddress) => {
            this.toastr.success('Address saved.');
            this.checkoutForm.get('addressForm')?.reset(address);
          }),
          catchError((error: any) => {
            this.toastr.error(error.message);
            console.error(error);
            return of();
          })
        )
        .subscribe();
    }
  }
}
