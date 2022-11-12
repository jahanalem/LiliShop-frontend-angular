import { ToastrService } from 'ngx-toastr';
import { FormGroup } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { IAddress } from 'src/app/shared/models/address';
import { AccountService } from 'src/app/core/services/account.service';

@Component({
  selector: 'app-checkout-address',
  templateUrl: './checkout-address.component.html',
  styleUrls: ['./checkout-address.component.scss']
})
export class CheckoutAddressComponent implements OnInit {
  @Input() checkoutForm!: FormGroup

  constructor(private accountService: AccountService, private toastr: ToastrService) { }

  ngOnInit(): void {
  }

  saveUserAddress() {
    this.accountService.updateAddress(this.checkoutForm.get('addressForm')?.value)
      .subscribe((address: IAddress) => {
        this.toastr.success('Address saved.');
        this.checkoutForm.get('addressForm')?.reset(address);
      }, error => {
        this.toastr.error(error.message);
        console.log(error);
      });
  }
}
