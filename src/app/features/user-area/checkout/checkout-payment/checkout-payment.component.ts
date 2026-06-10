import { PaymentIntentResult, Stripe, StripeCardCvcElement, StripeCardExpiryElement, StripeCardNumberElement } from '@stripe/stripe-js';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, input, OnDestroy, signal, ViewChild } from '@angular/core';
import { IBasket } from 'src/app/shared/models/basket';
import { NavigationExtras, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { BasketService } from 'src/app/core/services/basket.service';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { IOrder, IOrderToCreate } from 'src/app/shared/models/order';
import { getStripeInstance } from 'src/app/core/helpers/stripe-utils';
import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/core/services/notification.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { type CheckoutForm } from '../checkout.component';

@Component({
  selector: 'app-checkout-payment',
  templateUrl: './checkout-payment.component.html',
  styleUrls: ['./checkout-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SharedModule]
})
export class CheckoutPaymentComponent implements AfterViewInit, OnDestroy {
  checkoutForm = input.required<CheckoutForm>();

  @ViewChild('cardNumber', { static: true }) cardNumberElement!: ElementRef;
  @ViewChild('cardExpiry', { static: true }) cardExpiryElement!: ElementRef;
  @ViewChild('cardCvc', { static: true }) cardCvcElement!: ElementRef;

  stripe!: Stripe;
  cardNumber!: StripeCardNumberElement;
  cardExpiry!: StripeCardExpiryElement;
  cardCvc!: StripeCardCvcElement;
  cardErrors: any;

  cardHandler = this.onChange.bind(this);

  cardNumberValid = signal(false);
  cardExpiryValid = signal(false);
  cardCvcValid = signal(false);
  loading = signal(false);

  private basketService = inject(BasketService);
  private checkoutService = inject(CheckoutService);
  public notificationService = inject(NotificationService);
  private router = inject(Router);

  ngOnDestroy(): void {
    try {
      this.cardNumber?.destroy();
      this.cardExpiry?.destroy();
      this.cardCvc?.destroy();
    } catch (error) {
      console.error('Error during component cleanup:', error);
    }
  }

  ngAfterViewInit(): void {
    if (environment.production) {
      this.stripe = getStripeInstance('pk_test_51PrMdJDZqcE4cmELulf8TivRzyPX0Zh2AAm8E6Cz69vKovu0lOrFn0C9RMZzbG08bFp6f10aRtIH72QYdxtJKhhh00IT5f53Yb');
      console.log('Running stripe in production mode');
    } else {
      this.stripe = getStripeInstance('pk_test_51Lz52AF9mJP0HDJlxywtwHnNN6oYxUatlItmQhmUMJLwTHPIMJPVgWzz6ijcK6T8Cu1p6peNKGMmqXuVs8bh2K2K00ln2GWH1N');
      console.log('Running stripe in development mode');
    }
    const elements = this.stripe.elements();

    this.cardNumber = elements.create('cardNumber');
    this.cardNumber.mount(this.cardNumberElement.nativeElement);
    this.cardNumber.on('change', this.cardHandler);

    this.cardExpiry = elements.create('cardExpiry');
    this.cardExpiry.mount(this.cardExpiryElement.nativeElement);
    this.cardExpiry.on('change', this.cardHandler);

    this.cardCvc = elements.create('cardCvc');
    this.cardCvc.mount(this.cardCvcElement.nativeElement);
    this.cardCvc.on('change', this.cardHandler);
  }

  async submitOrder(): Promise<void> {
    this.loading.set(true);

    const basket = this.basketService.getCurrentBasketValue();
    if (!basket) {
      this.loading.set(false);
      return;
    }

    try {
      const [createdOrder, paymentResult] = await Promise.all([
        this.createOrder(basket),
        this.confirmPaymentWithStripe(basket),
      ]);

      if (paymentResult.paymentIntent) {
        this.handleSuccessfulPayment(createdOrder, basket);
      } else {
        this.notificationService.showError(paymentResult.error.message ?? 'Error!');
      }
    } catch (error) {
      console.error('An error occurred while submitting the order:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private handleSuccessfulPayment(createdOrder: IOrder, basket: IBasket): void {
    this.basketService.deleteBasket(basket).subscribe({
      next: () => console.log('Basket deleted'),
      error: (error: any) => console.error('Error deleting basket:', error),
    });

    const navigationExtras: NavigationExtras = { state: { order: createdOrder } };
    this.router.navigate(['checkout/success'], navigationExtras);
  }

  public async confirmPaymentWithStripe(basket: IBasket): Promise<PaymentIntentResult> {
    if (!basket.clientSecret) {
      const errorMsg = 'Client secret is missing';
      this.notificationService.showError(errorMsg);
      throw new Error(errorMsg);
    }

    const paymentMethodDetails = {
      card: this.cardNumber,
      billing_details: {
        // Read the leaf value straight off the form node.
        name: this.checkoutForm().payment.nameOnCard().value(),
      },
    };

    return this.stripe.confirmCardPayment(basket.clientSecret, {
      payment_method: paymentMethodDetails,
    });
  }

  public async createOrder(basket: IBasket): Promise<IOrder> {
    try {
      const orderToCreate = this.getOrderToCreate(basket);
      return await lastValueFrom(this.checkoutService.createOrder(orderToCreate));
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  private getOrderToCreate(basket: IBasket): IOrderToCreate {
    // Read group/leaf values from the shared form node.
    const deliveryMethodId = this.checkoutForm().delivery.deliveryMethod().value();
    if (deliveryMethodId == null) {
      throw new Error('No delivery method selected');
    }
    const shipToAddress = this.checkoutForm().address().value();

    return {
      basketId: basket.id,
      deliveryMethodId,
      shipToAddress,
    };
  }

  onChange(event: any): void {
    this.cardErrors = event.error?.message || null;

    switch (event.elementType) {
      case 'cardNumber':
        this.cardNumberValid.set(event.complete);
        break;
      case 'cardExpiry':
        this.cardExpiryValid.set(event.complete);
        break;
      case 'cardCvc':
        this.cardCvcValid.set(event.complete);
        break;
    }
  }

  isActivatedSubmitButton(): boolean | undefined {
    return (
      this.loading() ||
      this.checkoutForm().payment().invalid() ||
      !this.cardNumberValid() ||
      !this.cardExpiryValid() ||
      !this.cardCvcValid()
    );
  }
}
