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
  readonly message=signal('Checking payment status…');
  private route=inject(ActivatedRoute);
  private service=inject(CheckoutService);
  private subscription?:Subscription;
  ngOnInit():void { this.refresh(); }
  refresh():void {
    const id=this.route.snapshot.queryParamMap.get('checkout');
    if(!id) { this.message.set('No saved checkout was selected. Open your order history to check payment status.'); return; }
    this.subscription?.unsubscribe();
    this.subscription=this.service.status(id).subscribe({next:view=>{
      this.checkout.set(view);
      this.message.set(view.state==='PaymentVerified' ? 'Payment received. Your order is awaiting processing.'
        : view.state==='ReviewRequired' ? 'Your payment needs review. Please contact support before paying again.'
        : 'Payment has not been verified. Check again before starting another payment.');
    },error:()=>this.message.set('Payment status is unavailable. Please check again before paying.')});
  }
  ngOnDestroy():void { this.subscription?.unsubscribe(); }
}
