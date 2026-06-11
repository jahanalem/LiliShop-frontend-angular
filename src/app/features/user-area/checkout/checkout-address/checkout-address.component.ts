import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChangeDetectionStrategy, Component, inject, input, OnDestroy } from '@angular/core';
import { Subject, catchError, of, takeUntil, tap } from 'rxjs';
import { IAddress } from 'src/app/shared/models/address';
import { AccountService } from 'src/app/core/services/account.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { RouterModule } from '@angular/router';
import { CdkStepperModule } from '@angular/cdk/stepper';

import { type CheckoutForm } from '../checkout.component';

@Component({
  selector: 'app-checkout-address',
  templateUrl: './checkout-address.component.html',
  styleUrls: ['./checkout-address.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterModule, TextInputComponent, MatButtonModule, MatIconModule, CdkStepperModule]
})
export class CheckoutAddressComponent implements OnDestroy {
  // The whole checkout form node, passed down from the parent.
  checkoutForm = input.required<CheckoutForm>();

  destroy$ = new Subject<void>();

  private accountService = inject(AccountService);
  private notificationService = inject(NotificationService);

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveUserAddress(): void {
    const address = this.checkoutForm().address().value() as IAddress;

    this.accountService
      .updateAddress(address)
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.notificationService.showSuccess('Address saved.')),
        catchError((error: any) => {
          this.notificationService.showError(error.message);
          console.error(error);
          return of();
        }),
      )
      .subscribe();
  }

  isSaveDisabled(): boolean {
    const address = this.checkoutForm().address();
    return !address.valid() || !address.dirty();
  }
}
