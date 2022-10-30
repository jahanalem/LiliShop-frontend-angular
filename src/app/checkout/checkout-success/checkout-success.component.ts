import { AccountService } from './../../account/account.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IOrder } from 'src/app/shared/models/order';
import { Observable, of } from 'rxjs';
import { IUser } from 'src/app/shared/models/user';

@Component({
  selector: 'app-checkout-success',
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.scss']
})
export class CheckoutSuccessComponent implements OnInit {
  protected currentUser$: Observable<IUser | null> = of(null);
  order!: IOrder;

  constructor(private router: Router, private accountService: AccountService) {
    const navigation = this.router.getCurrentNavigation();
    this.currentUser$ = this.accountService.currentUser$;
    const state = navigation?.extras?.state;
    if (state) {
      this.order = state as IOrder;
    }
  }

  ngOnInit(): void {
  }

}
