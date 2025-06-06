
import { PaymentIntentResult, Stripe, StripeCardCvcElement, StripeCardExpiryElement, StripeCardNumberElement } from '@stripe/stripe-js';
import { FormGroup } from '@angular/forms';
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


@Component({
    selector: 'app-checkout-payment',
    templateUrl: './checkout-payment.component.html',
    styleUrls: ['./checkout-payment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CheckoutPaymentComponent implements AfterViewInit, OnDestroy {
  checkoutForm = input.required<FormGroup>();
  @ViewChild('cardNumber', { static: true }) cardNumberElement!: ElementRef;
  @ViewChild('cardExpiry', { static: true }) cardExpiryElement!: ElementRef;
  @ViewChild('cardCvc', { static: true }) cardCvcElement!: ElementRef;

  /*
     the reason for using any is that we're not using typescript with Stripe.
     It's a JavaScript library and we are in the murky world of pure JavaScript and goodbye type safety, in other words.
  */

  stripe!    : Stripe;
  cardNumber!: StripeCardNumberElement;
  cardExpiry!: StripeCardExpiryElement;
  cardCvc!   : StripeCardCvcElement;
  cardErrors : any;

  cardHandler = this.onChange.bind(this);

  cardNumberValid = signal(false);
  cardExpiryValid = signal(false);
  cardCvcValid    = signal(false);
  loading         = signal(false);

  private basketService       = inject(BasketService);
  private checkoutService     = inject(CheckoutService);
  public  notificationService = inject(NotificationService);
  private router              = inject(Router);

  constructor() {

  }

  ngOnDestroy(): void {
    try {
      if (this.cardNumber) {
        this.cardNumber.destroy();
      }
      if (this.cardExpiry) {
        this.cardExpiry.destroy();
      }
      if (this.cardCvc) {
        this.cardCvc.destroy();
      }
    } catch (error) {
      console.error('Error during component cleanup:', error);
    }
  }

  ngAfterViewInit(): void {
    if (environment.production) {
      this.stripe = getStripeInstance('pk_test_51PrMdJDZqcE4cmELulf8TivRzyPX0Zh2AAm8E6Cz69vKovu0lOrFn0C9RMZzbG08bFp6f10aRtIH72QYdxtJKhhh00IT5f53Yb');
      console.log('Running stripe in production mode');
    }
    else {
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

  /**
 * Asynchronously submits the order.
 * This method handles both the order creation and the Stripe payment confirmation.
 */
  async submitOrder() {
    // Start the loading spinner.
    this.loading.set(true);

    // Retrieve the current basket value.
    const basket = this.basketService.getCurrentBasketValue();

    // If the basket is null or undefined, stop the loading spinner and return.
    if (!basket) {
      this.loading.set(false);
      return;
    }

    try {
      // Perform both the order creation and Stripe payment confirmation in parallel.
      const [createdOrder, paymentResult] = await Promise.all([
        this.createOrder(basket),
        this.confirmPaymentWithStripe(basket),
      ]);

      // If the payment is successful, proceed with the order.
      if (paymentResult.paymentIntent) {
        this.handleSuccessfulPayment(createdOrder, basket);
      } else {
        // Handle card failure or other Stripe issues.
        this.notificationService.showError(paymentResult.error.message ?? 'Error!');
      }
    } catch (error) {
      console.error('An error occurred while submitting the order:', error);
    } finally {
      // Stop the loading spinner.
      this.loading.set(false);
    }
  }

  /**
   * Handles successful payments by deleting the basket and navigating to the success page.
   * @param createdOrder - The created order object.
   * @param basket - The current basket object.
   */
  private handleSuccessfulPayment(createdOrder: IOrder, basket: IBasket) {
    this.basketService.deleteBasket(basket).subscribe({
      next: () => console.log('Basket deleted'),
      error: (error: any) => console.error('Error deleting basket:', error),
    });

    // Pass the created order to the success page as state data.
    const navigationExtras: NavigationExtras = { state: { order: createdOrder } };
    this.router.navigate(['checkout/success'], navigationExtras);
  }


  /**
  * Confirm payment with Stripe.
  * This method sends the payment information to Stripe for payment processing.
  *
  * @param basket - The basket object containing the client secret for Stripe.
  * @returns A promise that resolves with the Stripe PaymentIntentResult.
  * @throws Will throw an error if the client secret is missing.
  */
  public async confirmPaymentWithStripe(basket: IBasket): Promise<PaymentIntentResult> {

    // Validate that the client secret exists
    if (!basket.clientSecret) {
      const errorMsg = 'Client secret is missing';
      this.notificationService.showError(errorMsg);  // Show error notification
      throw new Error(errorMsg);
    }

    // Define payment method details
    const paymentMethodDetails = {
      card: this.cardNumber,
      billing_details: {
        name: this.checkoutForm()?.get('paymentForm')?.get('nameOnCard')?.value,
      },
    };

    // Confirm card payment with Stripe
    return this.stripe.confirmCardPayment(basket.clientSecret, {
      payment_method: paymentMethodDetails,
    });
  }

  /**
   * Create a new order.
   * This method sends the order information to the backend service for processing.
   *
   * @param basket - The basket object to be converted into an order.
   * @returns A promise that resolves with the created order object.
   * @throws Will throw an error if the order creation fails.
   */
  public async createOrder(basket: IBasket): Promise<IOrder> {
    try {
      // Create an order object based on the current basket
      const orderToCreate = this.getOrderToCreate(basket);

      // Send the order to the backend and wait for a response
      return await lastValueFrom(this.checkoutService.createOrder(orderToCreate));
    } catch (error) {
      console.error('Error creating order:', error); // Log the error for debugging
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  /**
   * Constructs an object to represent the order that will be created.
   *
   * @param basket - The current basket object containing items to be ordered.
   * @returns An object conforming to the IOrderToCreate interface.
   */
  private getOrderToCreate(basket: IBasket): IOrderToCreate {
    // Retrieve the delivery and address forms from the checkout form group
    const deliveryForm = this.checkoutForm()?.get('deliveryForm');
    const addressForm = this.checkoutForm()?.get('addressForm');

    // Extract the selected delivery method ID and shipping address
    const deliveryMethodId = deliveryForm?.get('deliveryMethod')?.value;
    const shipToAddress = addressForm?.value;

    // Construct and return the order object
    return {
      basketId: basket.id,
      deliveryMethodId,
      shipToAddress,
    };
  }

  onChange(event: any) {
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

  isActivatedSubmitButton() {
    return this.loading()
      || this.checkoutForm().get('paymentForm')?.invalid
      || !this.cardNumberValid()
      || !this.cardExpiryValid()
      || !this.cardCvcValid()
  }
}
