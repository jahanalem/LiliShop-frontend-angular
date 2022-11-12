import { ToastrService } from 'ngx-toastr';
import { FormGroup } from '@angular/forms';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { IBasket } from 'src/app/shared/models/basket';
import { NavigationExtras, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { BasketService } from 'src/app/core/services/basket.service';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { IOrder, IOrderToCreate } from 'src/app/shared/models/order';

declare var Stripe: any;

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

  stripe: any;
  cardNumber: any;
  cardExpiry: any;
  cardCvc: any;
  cardErrors: any;
  cardHandler = this.onChange.bind(this);
  cardNumberValid = false;
  cardExpiryValid = false;
  cardCvcValid = false;
  loading = false;

  constructor(
    private basketService: BasketService,
    private checkoutService: CheckoutService,
    private toastr: ToastrService,
    private router: Router) { }

  ngOnDestroy(): void {
    this.cardNumber.destroy();
    this.cardExpiry.destroy();
    this.cardCvc.destroy();
  }

  ngAfterViewInit(): void {
    this.stripe = Stripe('pk_test_51Lz52AF9mJP0HDJlqVT7v9BgFVtpfr5opjM1vm376whHSJx1SkoPvVKC1KtPhM4xVwIe1fcd3jjl2wJ25ekymjsR00JKVfDqJi');
    const elements = this.stripe.elements();

    this.cardNumber = elements.create('cardNumber');
    this.cardNumber.mount(this.cardNumberElement.nativeElement);
    this.cardNumber.addEventListener('change', this.cardHandler);

    this.cardExpiry = elements.create('cardExpiry');
    this.cardExpiry.mount(this.cardExpiryElement.nativeElement);
    this.cardExpiry.addEventListener('change', this.cardHandler);

    this.cardCvc = elements.create('cardCvc');
    this.cardCvc.mount(this.cardCvcElement.nativeElement);
    this.cardCvc.addEventListener('change', this.cardHandler);
  }

  async submitOrder() {
    this.loading = true;

    const basket = this.basketService.getCurrentBasketValue();
    if (!basket) {
      return;
    }

    try {
      const createdOrder = await this.createOrder(basket);
      const paymentResult = await this.confirmPaymentWithStripe(basket);

      if (paymentResult.paymentIntent) {
        this.basketService.deleteBasket(basket);
        const navigationExtras: NavigationExtras = { state: { order: createdOrder } };
        this.router.navigate(['checkout/success'], navigationExtras);
      } else {
        // It means that card has failed to be accepted by Stripe for whatever reason.
        this.toastr.error(paymentResult.error.message);
      }

      this.loading = false;

    } catch (error) {
      console.log(error);
    }
  }

  private async confirmPaymentWithStripe(basket: IBasket): Promise<any> {
    return this.stripe.confirmCardPayment(basket.clientSecret, {
      payment_method: {
        card: this.cardNumber,
        billing_details: {
          name: this.checkoutForm.get('paymentForm')?.get('nameOnCard')?.value
        }
      }
    });
  }

  private async createOrder(basket: IBasket): Promise<IOrder | undefined> {
    const orderToCreate = this.getOrderToCreate(basket);
    return lastValueFrom(this.checkoutService.createOrder(orderToCreate)); // https://rxjs.dev/deprecations/to-promise
  }

  private getOrderToCreate(basket: IBasket): IOrderToCreate {
    return {
      basketId: basket.id,
      deliveryMethodId: this.checkoutForm.get('deliveryForm')?.get('deliveryMethod')?.value,
      shipToAddress: this.checkoutForm.get('addressForm')?.value
    } as IOrderToCreate;
  }

  onChange(event: any) {
    if (event.error) {
      this.cardErrors = event.error.message;
    } else {
      this.cardErrors = null;
    }
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
