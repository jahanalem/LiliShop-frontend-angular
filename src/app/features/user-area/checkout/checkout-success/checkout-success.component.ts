import { Component, OnInit } from '@angular/core';
import { Navigation, Router } from '@angular/router';
import { IOrder } from 'src/app/shared/models/order';
import { Observable, of } from 'rxjs';
import { IUser } from 'src/app/shared/models/user';
import { AccountService } from 'src/app/core/services/account.service';

@Component({
  selector: 'app-checkout-success',
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.scss']
})
export class CheckoutSuccessComponent implements OnInit {
  protected currentUser$: Observable<IUser | null> = of(null);
  public order!: IOrder;

  constructor(private router: Router, private accountService: AccountService) {
    const navigation = this.router.getCurrentNavigation();
    this.currentUser$ = this.accountService.currentUser$;
    this.initializeOrderFromNavigationState(navigation);
  }

  ngOnInit(): void {
  }

  initializeOrderFromNavigationState(navigation: Navigation | null) {
    const state = navigation?.extras?.state;
    if (state && state['order']) {
      this.order = state['order'] as IOrder;
    }
  }
}
