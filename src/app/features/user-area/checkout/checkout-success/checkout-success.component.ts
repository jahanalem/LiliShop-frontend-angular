import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Navigation, Router } from '@angular/router';
import { IOrder } from 'src/app/shared/models/order';
import { Observable, of } from 'rxjs';
import { IUser } from 'src/app/shared/models/user';
import { AccountService } from 'src/app/core/services/account.service';

@Component({
  selector: 'app-checkout-success',
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutSuccessComponent {
  protected currentUser$: Observable<IUser | null> = of(null);

  order = signal<IOrder>({} as IOrder);

  private router         = inject(Router);
  private accountService = inject(AccountService);

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    this.currentUser$ = this.accountService.currentUser$;
    this.initializeOrderFromNavigationState(navigation);
  }

  initializeOrderFromNavigationState(navigation: Navigation | null) {
    const state = navigation?.extras?.state;
    if (state && state['order']) {
      this.order.set(state['order'] as IOrder);
    }
  }
}
