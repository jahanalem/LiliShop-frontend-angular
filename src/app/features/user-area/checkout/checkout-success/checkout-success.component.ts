import { FulfillmentService } from 'src/app/core/services/fulfillment.service';
import { CustomerProcessing } from 'src/app/shared/models/fulfillment';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { fulfillmentText } from 'src/app/core/i18n/fulfillment-text';
import { MatButtonModule } from '@angular/material/button';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CheckoutService } from 'src/app/core/services/checkout.service';
import { CheckoutView } from 'src/app/shared/models/checkout';

@Component({selector:'app-checkout-success',templateUrl:'./checkout-success.component.html',
  styleUrls:['./checkout-success.component.scss'],changeDetection:ChangeDetectionStrategy.OnPush,
  standalone:true,imports:[RouterModule,MatButtonModule]})
export class CheckoutSuccessComponent implements OnInit,OnDestroy {
  readonly checkout=signal<CheckoutView|null>(null);
  private translation = inject(TranslationService);
  private fulfillment = inject(FulfillmentService);
  readonly processing = signal<CustomerProcessing|null>(null);
  readonly processingError = signal(false);
  readonly message = signal(this.t('Checking'));
  private processingSubscription?: Subscription;
  t(name: string): string { return fulfillmentText(this.translation, name); }
  private route=inject(ActivatedRoute);
  private service=inject(CheckoutService);
  private subscription?:Subscription;
  ngOnInit():void { this.refresh(); }
  refresh():void {
    this.checkout.set(null); this.processing.set(null); this.processingError.set(false);
    this.processingSubscription?.unsubscribe();
    const id=this.route.snapshot.queryParamMap.get('checkout');
    if(!id) { this.message.set(this.t('MissingCheckout')); return; }
    this.subscription?.unsubscribe();
    this.subscription=this.service.status(id).subscribe({next:view=>{
      this.checkout.set(view);
      this.message.set(this.t(view.state==='PaymentVerified' ? 'PaymentReceived' : view.state==='ReviewRequired' ? 'PaymentReview' : 'Unverified'));
      if (view.state === 'PaymentVerified' && view.orderId) {
        this.processingSubscription = this.fulfillment.status(view.orderId).subscribe({
          next: progress => this.processing.set(progress), error: () => this.processingError.set(true)
        });
      }
    },error:()=>this.message.set(this.t('StatusUnavailable'))});
  }
  ngOnDestroy():void { this.subscription?.unsubscribe(); this.processingSubscription?.unsubscribe(); }
}
