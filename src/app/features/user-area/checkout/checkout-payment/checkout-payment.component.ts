import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PaymentIntentResult, Stripe, StripeCardCvcElement, StripeCardExpiryElement, StripeCardNumberElement, StripeElementStyle } from '@stripe/stripe-js';
import { AfterViewInit, ChangeDetectionStrategy, Component, DOCUMENT, effect, ElementRef, inject, Injector, input, OnDestroy, signal, viewChild } from '@angular/core';
import { IBasket } from 'src/app/shared/models/basket';
import { NavigationExtras, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { BasketService } from 'src/app/core/services/basket.service';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { IOrder, IOrderToCreate } from 'src/app/shared/models/order';
import { getStripeInstance } from 'src/app/core/helpers/stripe-utils';
import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { type CheckoutForm } from '../checkout.component';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
  selector: 'app-checkout-payment',
  templateUrl: './checkout-payment.component.html',
  styleUrls: ['./checkout-payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslatePipe, TextInputComponent, MatButtonModule, MatIconModule, MatCardModule, CdkStepperModule]
})
export class CheckoutPaymentComponent implements AfterViewInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  checkoutForm = input.required<CheckoutForm>();

  readonly cardNumberElement = viewChild.required<ElementRef>('cardNumber');
  readonly cardExpiryElement = viewChild.required<ElementRef>('cardExpiry');
  readonly cardCvcElement = viewChild.required<ElementRef>('cardCvc');

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
  private themeService = inject(ThemeService);
  private injector = inject(Injector);
  private document = inject(DOCUMENT);

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
    this.stripe = getStripeInstance(environment.stripePublishableKey);
    const elements = this.stripe.elements();
    const style = this.buildStripeElementStyle();

    this.cardNumber = elements.create('cardNumber', { style });
    this.cardNumber.mount(this.cardNumberElement().nativeElement);
    this.cardNumber.on('change', this.cardHandler);

    this.cardExpiry = elements.create('cardExpiry', { style });
    this.cardExpiry.mount(this.cardExpiryElement().nativeElement);
    this.cardExpiry.on('change', this.cardHandler);

    this.cardCvc = elements.create('cardCvc', { style });
    this.cardCvc.mount(this.cardCvcElement().nativeElement);
    this.cardCvc.on('change', this.cardHandler);

    // Stripe Elements render inside a cross-origin iframe and can't read our
    // --ls-* CSS variables, so without an explicit color the card text keeps
    // Stripe's default near-black — invisible on the dark-mode surface. Push
    // resolved theme colors in again whenever the theme is toggled.
    effect(() => {
      this.themeService.theme();
      const nextStyle = this.buildStripeElementStyle();
      this.cardNumber?.update({ style: nextStyle });
      this.cardExpiry?.update({ style: nextStyle });
      this.cardCvc?.update({ style: nextStyle });
    }, { injector: this.injector });
  }

  /**
   * Builds a Stripe Elements style object from the active theme. Stripe's
   * iframe can't see our design tokens, and reading a custom property via
   * getComputedStyle returns the literal light-dark(...) expression, so each
   * color is resolved to a concrete value through a hidden probe element.
   */
  private buildStripeElementStyle(): StripeElementStyle {
    const text = this.resolveThemeColor('--ls-text', '#181c2a');
    const placeholder = this.resolveThemeColor('--ls-text-faint', '#676e85');
    const danger = this.resolveThemeColor('--ls-danger', '#ba1a1a');

    return {
      base: {
        color: text,
        iconColor: text,
        fontFamily: '"Inter", Roboto, "Helvetica Neue", system-ui, sans-serif',
        fontSize: '16px',
        '::placeholder': { color: placeholder },
      },
      invalid: {
        color: danger,
        iconColor: danger,
      },
    };
  }

  private resolveThemeColor(variable: string, fallback: string): string {
    const probe = this.document.createElement('span');
    probe.style.color = `var(${variable})`;
    probe.style.position = 'absolute';
    probe.style.opacity = '0';
    probe.style.pointerEvents = 'none';
    this.document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved || fallback;
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
