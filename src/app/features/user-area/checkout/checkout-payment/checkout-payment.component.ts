
import { PaymentIntentResult, Stripe, StripeCardCvcElement, StripeCardExpiryElement, StripeCardNumberElement } from '@stripe/stripe-js';
import { ToastrService } from 'ngx-toastr';
import { FormGroup } from '@angular/forms';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { IBasket } from 'src/app/shared/models/basket';
import { NavigationExtras, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { BasketService } from 'src/app/core/services/basket.service';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { IOrder, IOrderToCreate } from 'src/app/shared/models/order';
import { getStripeInstance } from 'src/app/core/helpers/stripe-utils';


@Component({
  selector: 'app-checkout-payment',
  templateUrl: './checkout-payment.component.html',
  styleUrls: ['./checkout-payment.component.scss']
})
export class CheckoutPaymentComponent implements AfterViewInit, OnDestroy {
  @Input() checkoutForm!: FormGroup;
  @ViewChild('cardNumber', { static: true }) cardNumberElement!: ElementRef;
  @ViewChild('cardExpiry', { static: true }) cardExpiryElement!: ElementRef;
  @ViewChild('cardCvc', { static: true }) cardCvcElement!: ElementRef;

  /*
     the reason for using any is that we're not using typescript with Stripe.
     It's a JavaScript library and we are in the murky world of pure JavaScript and goodbye type safety, in other words.
  */

  stripe!: Stripe;
  cardNumber!: StripeCardNumberElement;
  cardExpiry!: StripeCardExpiryElement;
  cardCvc!: StripeCardCvcElement;
  cardErrors: any;
  cardHandler = this.onChange.bind(this);
  cardNumberValid = false;
  cardExpiryValid = false;
  cardCvcValid = false;
  loading = false;

  constructor(
    private basketService: BasketService,
    private checkoutService: CheckoutService,
    public toastr: ToastrService,
    private router: Router) { }

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
    this.stripe = getStripeInstance('pk_test_51Lz52AF9mJP0HDJllK6M7K8UyPc6xtoICZB9soUuoKmComGEA5yzUL1mLBBOglE8wPAMs5A8wFwNXuDWhFOxaqdF00L70K47Pm');
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

  async submitOrder() {
    this.loading = true;

    const basket = this.basketService.getCurrentBasketValue();
    if (!basket) {
      this.loading = false;
      return;
    }

    try {
      const [createdOrder, paymentResult] = await Promise.all([
        this.createOrder(basket),
        this.confirmPaymentWithStripe(basket),
      ]);

      if (paymentResult.paymentIntent) {
        this.basketService.deleteBasket(basket).subscribe({
          next: () => console.log('Basket deleted'),
          error: (error: any) => { console.error('Error deleting basket:', error); },
        });
        const navigationExtras: NavigationExtras = { state: { order: createdOrder } };
        this.router.navigate(['checkout/success'], navigationExtras);
      } else {
        // It means that card has failed to be accepted by Stripe for whatever reason.
        this.toastr.error(paymentResult.error.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.loading = false;
    }
  }

  public async confirmPaymentWithStripe(basket: IBasket): Promise<PaymentIntentResult> {
    if (!basket.clientSecret) {
      const errorMsg = 'Client secret is missing';
      this.toastr.error(errorMsg);
      throw new Error(errorMsg);
    }
    return this.stripe.confirmCardPayment(basket.clientSecret, {
      payment_method: {
        card: this.cardNumber,
        billing_details: {
          name: this.checkoutForm.get('paymentForm')?.get('nameOnCard')?.value,
        },
      },
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
    const deliveryForm = this.checkoutForm.get('deliveryForm');
    const addressForm = this.checkoutForm.get('addressForm');
    const deliveryMethodId = deliveryForm?.get('deliveryMethod')?.value;
    const shipToAddress = addressForm?.value;

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
        this.cardNumberValid = event.complete;
        break;
      case 'cardExpiry':
        this.cardExpiryValid = event.complete;
        break;
      case 'cardCvc':
        this.cardCvcValid = event.complete;
        break;
    }
  }
}
