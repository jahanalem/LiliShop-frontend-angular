import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { BasketService } from 'src/app/core/services/basket.service';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { Subject } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { Router } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { type CheckoutForm } from '../checkout.component';

@Component({
  selector: 'app-checkout-delivery',
  templateUrl: './checkout-delivery.component.html',
  styleUrls: ['./checkout-delivery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatRadioModule,  CommonModule, MatButtonModule, MatIconModule, CdkStepperModule]
})
export class CheckoutDeliveryComponent implements OnInit, OnDestroy {
  checkoutForm = input.required<CheckoutForm>();

  // The parent owns the model, so selection bubbles up for it to write.
  readonly deliveryMethodSelected = output<IDeliveryMethod>();

  deliveryMethods = signal<IDeliveryMethod[]>([]);

  private destroy$ = new Subject<void>();

  private checkoutService = inject(CheckoutService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private basketService = inject(BasketService);

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.loadDeliveryMethods();
  }

  loadDeliveryMethods(): void {
    if (!this.accountService.isLoggedIn()) {
      console.error('User is not authenticated. Redirecting to login.');
      this.router.navigate(['/account/login']);
      return;
    }

    this.checkoutService.getDeliveryMethods().subscribe({
      next: (methods) => {
        if (methods.length === 0) {
          console.warn('No delivery methods available.');
        } else {
          this.deliveryMethods.set(methods);
        }
      },
      error: (error) => console.error('Failed to load delivery methods:', error),
    });
  }

  onDeliveryMethodChange(deliveryMethod: IDeliveryMethod): void {
    // Let the parent write the model; update the basket shipping here.
    this.deliveryMethodSelected.emit(deliveryMethod);
    this.setShippingPrice(deliveryMethod);
  }

  setShippingPrice(deliveryMethod: IDeliveryMethod): void {
    this.basketService.setShippingPrice(deliveryMethod);
  }
}