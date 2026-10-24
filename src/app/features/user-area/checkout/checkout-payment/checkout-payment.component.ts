import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Stripe, StripeCardCvcElement, StripeCardExpiryElement, StripeCardNumberElement, StripeElementStyle } from '@stripe/stripe-js';
import { AfterViewInit, ChangeDetectionStrategy, Component, DOCUMENT, effect, ElementRef, inject, Injector, input, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom, Subscription, timer, exhaustMap, take, filter, timeout } from 'rxjs';
import { CheckoutView } from 'src/app/shared/models/checkout';
import { BasketService } from 'src/app/core/services/basket.service';
import { CheckoutService } from 'src/app/core/services/checkout.service';
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
export class CheckoutPaymentComponent implements AfterViewInit, OnDestroy, OnInit {
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
  private readonly confirmationPending = signal(false);
  readonly checkout = signal<CheckoutView|null>(null);
  readonly statusMessage = signal('');
  private polling?: Subscription;
  private stripeReady?: Subscription;
  private destroyed = false;

  ngOnInit(): void {
    this.polling = this.checkoutService.retainedStatus().subscribe({
      next: view => { if(view) { this.acceptStatus(view); if(view.state==='Preparing' || view.state==='Ready') this.pollStatus(view.id); } },
      error: () => this.statusMessage.set('Your saved payment status is unavailable. Please retry; your checkout identity is retained.')
    });
  }

  private basketService = inject(BasketService);
  private checkoutService = inject(CheckoutService);
  public notificationService = inject(NotificationService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private injector = inject(Injector);
  private document = inject(DOCUMENT);

  ngOnDestroy(): void {
    this.destroyed=true;
    this.stripeReady?.unsubscribe();
    this.polling?.unsubscribe();
    try {
      this.cardNumber?.destroy();
      this.cardExpiry?.destroy();
      this.cardCvc?.destroy();
    } catch (error) {
      console.error('Error during component cleanup:', error);
    }
  }

  ngAfterViewInit(): void {
    if (typeof window.Stripe === 'function') { this.mountCardElements(); return; }
    // The consent-controlled script loads asynchronously, including on direct entry and reload.
    this.stripeReady=timer(0,100).pipe(filter(()=>typeof window.Stripe==='function'),take(1),
      timeout({first:30000})).subscribe({
        next:()=>this.mountCardElements(),
        error:()=>this.statusMessage.set('Payment form could not load. Allow payment cookies and reload to try again. Your saved checkout is retained.')
      });
  }

  private mountCardElements(): void {
    if(this.destroyed) return;
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
    // Stripe's default near-black ط£آ¢أ¢â€ڑآ¬أ¢â‚¬â€Œ invisible on the dark-mode surface. Push
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
    if(this.loading() || this.destroyed || this.confirmationPending()) return;
    this.loading.set(true);
    const basket=this.basketService.getCurrentBasketValue();
    if(!basket) { this.loading.set(false); return; }
    try {
      const deliveryMethodId=this.checkoutForm().delivery.deliveryMethod().value();
      if(deliveryMethodId==null) throw new Error('Delivery method required');
      const prepared=await lastValueFrom(this.checkoutService.prepareCheckout({basketId:basket.id,deliveryMethodId,
        shipToAddress:this.checkoutForm().address().value(),
        lines:basket.items.map(item=>({productId:item.id,productVariantId:item.productVariantId??undefined,quantity:item.quantity}))}));
      if(this.destroyed) return;
      this.acceptStatus(prepared);
      if(prepared.state!=='Ready') { if(prepared.state==='Preparing') this.pollStatus(prepared.id); return; }
      const confirmation=await lastValueFrom(this.checkoutService.confirmation(prepared.id));
      if(this.destroyed) return;
      this.acceptStatus(confirmation.checkout);
      if(!confirmation.clientSecret) { this.pollStatus(prepared.id); return; }
      const result=await this.stripe.confirmCardPayment(confirmation.clientSecret, {payment_method: {
        card:this.cardNumber,billing_details:{name:this.checkoutForm().payment.nameOnCard().value()}
      }});
      if(this.destroyed) return;
      if(result.error) this.notificationService.showError(result.error.message ?? 'Payment confirmation could not be completed.');
      if(!result.error && ['succeeded','processing'].includes(result.paymentIntent?.status ?? ''))
        this.confirmationPending.set(true);
      // A browser callback, including success, cannot release an order. Read signed server verification.
      this.statusMessage.set('Checking payment status. You can safely reload this page.');
      this.pollStatus(prepared.id);
    } catch(error: any) {
      const code=error?.error?.code;
      this.statusMessage.set(code==='checkout_paused' || code==='fulfillment_release_not_ready'
        ? 'Checkout is temporarily unavailable. Your saved checkout is retained.'
        : code==='checkout_input_changed' ? 'Your purchase changed. Resume or cancel the saved checkout before starting another.'
        : 'Payment status is uncertain. Retry the saved checkout; do not start another payment.');
    } finally { this.loading.set(false); }
  }

  private pollStatus(id: string): void {
    this.polling?.unsubscribe();
    this.polling=timer(0,2000).pipe(take(61),exhaustMap(()=>this.checkoutService.status(id))).subscribe({
      next: view => this.acceptStatus(view),
      error: () => this.statusMessage.set('Payment status is unavailable. Your saved checkout is retained; please check again.')
    });
  }
  private acceptStatus(view: CheckoutView): void {
    this.checkout.set(view);
    const messages: Record<CheckoutView['state'],string> = {
      Preparing:'Preparing your saved checkout. Please check again shortly.', Ready: this.confirmationPending()
        ? 'Waiting for server confirmation. Use Resume saved checkout to check again before paying.'
        : 'Your checkout is ready for payment.',
      Verifying:'Checking payment status. Please wait before trying again.', PaymentVerified:'Payment received. Your order is awaiting processing.',
      ReviewRequired:'Your payment needs review. Please contact support before paying again.',
      Expired:'This checkout has expired. Check its payment status before starting another.', Cancelled:'This checkout was cancelled.'
    };
    this.statusMessage.set(messages[view.state]);
    if(['PaymentVerified','ReviewRequired','Expired','Cancelled'].includes(view.state)) this.polling?.unsubscribe();
    if(view.state==='PaymentVerified') this.router.navigate(['checkout/success'], {queryParams:{checkout:view.id}});
  }
  async resumeSavedCheckout(): Promise<void> {
    if(this.loading()) return;
    this.loading.set(true);
    try {const view=await lastValueFrom(this.checkoutService.resumeSavedCheckout());if(view) this.acceptStatus(view);}
    catch {this.statusMessage.set('The saved checkout is unavailable. Its identity is retained; please check again.');}
    finally {this.loading.set(false);}
  }
  async cancelSavedCheckout(): Promise<void> {
    if(this.loading()) return;
    this.loading.set(true);
    try {
      const view=await lastValueFrom(this.checkoutService.cancelSavedCheckout());
      if(view) { this.acceptStatus(view); if(view.state==='Cancelled') this.checkout.set(null); }
    } catch { this.statusMessage.set('The saved checkout could not be cancelled. Resume it to establish its status first.'); }
    finally { this.loading.set(false); }
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
      this.loading() || this.confirmationPending() ||
      ['ReviewRequired','PaymentVerified','Expired','Cancelled'].includes(this.checkout()?.state ?? '') ||
      this.checkoutForm().payment().invalid() ||
      !this.cardNumberValid() ||
      !this.cardExpiryValid() ||
      !this.cardCvcValid()
    );
  }
}
