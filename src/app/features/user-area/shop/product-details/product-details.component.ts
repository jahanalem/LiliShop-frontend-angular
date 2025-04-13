import { NotificationService } from './../../../../core/services/notification.service';
import { of, switchMap } from 'rxjs';
import { IProduct } from 'src/app/shared/models/product';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { BasketService } from 'src/app/core/services/basket.service';
import { ProductService } from 'src/app/core/services/product.service';
import { INotificationSubscription } from 'src/app/shared/models/notificationSubscription';
import { AccountService } from 'src/app/core/services/account.service';

@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  product                   = signal<IProduct>({} as IProduct);
  quantity                  = signal<number>(1);
  isSubscribed              = signal<boolean>(false);
  currentUserId             = signal<number>(0);
  currentUserEmailConfirmed = signal<boolean>(false);

  discountTimeLeft = signal<string>('');

  private discountInterval: any;

  private activatedRoute      = inject(ActivatedRoute);
  private basketService       = inject(BasketService);
  private productService      = inject(ProductService);
  private notificationService = inject(NotificationService);
  private accountService      = inject(AccountService);
   private cdRef              = inject(ChangeDetectorRef);

  constructor() {
  }

  ngOnInit(): void {
    this.accountService.currentUser$.subscribe({
      next: (user) => {
        if (user && user.id) {
          this.currentUserId.set(user.id);
          this.currentUserEmailConfirmed.set(user.emailConfirmed);
        }
      },
      error:(err)=>{console.log("err = ", err);}
    });
    this.loadProduct();
  }

  ngOnDestroy(): void {
    if (this.discountInterval) {
      clearInterval(this.discountInterval);
    }
  }

  /*
  Consider the example where the user navigates to the /product/1 route.
  The service will send the query to the database to get the Product with id 1.
  Now, the user decides to navigate to the route /product/2.
  This will also result in another query for the Product being sent to the database.
  It is possible that the result of the second query arrives before the first query.
  In such a scenario, we will be in the route /product/2 , while our component displays the data of the product 1.

  We can easily solve the above issue using the switchMap.
  When SwitchMap creates the second observable it unsubscribes from all the previous observable.
  Hence even if the Product 1 data arrives late, it would be discarded as there are no subscribers
  https://www.tektutorialshub.com/angular/using-switchmap-in-angular/#comment-48220

  The paramMap processing is a bit tricky.
  When the map changes, you’ll get() the ID parameter from the changed parameters.
  You might think now is the time to use the RxJS map operator but the ShopService operator returns an Observable.
  So, you flatten the observable with the switchMap operator instead.
  The switchMap operator also cancels previous in-flight requests.
  If the user re-navigates to this route with a new ID while the ShopService is still retrieving the old ID,
   switchMap discards the old request and returns the product for the new ID.
*/
  loadProduct() {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        return id ? this.productService.getProduct(+id) : of();
      })
    ).subscribe({
      next: (product) => {
        this.product.update(()=>product);
        this.cdRef.detectChanges();
        if (this.discountActiveNow()) {
          this.startDiscountCountdown();
        }

        this.checkSubscriptionStatus();
      },
      error: (error) => {
        console.error(error);
      }
    });
    this.cdRef.detectChanges();
  }

  incrementQuantity() {
    this.quantity.update((value: number) => value + 1);
  }

  decrementQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(value => value - 1);
    }
  }

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product(), this.quantity());
  }

  checkSubscriptionStatus() {
    if (this.currentUserId() > 0) {
      this.notificationService.checkSubscription(this.product().id, this.currentUserId()).subscribe({
        next: (data: boolean) => {
          this.isSubscribed.set(data);
        },
        error: (error: any) => {
            this.isSubscribed.set(false);
            console.error(error);
          }
        }
      );
    }
    else {
      this.isSubscribed.set(false);
    }
  }

  toggleSubscription() {
    const subscription: INotificationSubscription = {
      productId: this.product().id,
      userId: this.currentUserId(),
      alertType: 'PriceDrop',
      isActive: true
    };

    if (this.isSubscribed()) {
      this.notificationService.removeSubscription(subscription).subscribe({
        next: () => {
          this.isSubscribed.set(false);
        },
        error: (error: any) => {
          console.error(error);
        }
      });
    } else {
      this.notificationService.addSubscription(subscription).subscribe({
        next: () => {
          this.isSubscribed.set(true);
        },
        error: (error: any) => {
          console.error(error);
        }
      });
    }
  }

  subscribeToPriceDrop() {
    const subscription: INotificationSubscription = {
      productId: this.product().id,
      userId: 16,
      alertType: 'PriceDrop',
      isActive: true
    }
    this.notificationService.addSubscription(subscription).subscribe({
      next: () => { alert('You have successfully subscribed to price drop notifications!'); },
      error: (error: any) => {
        console.error(error);
        alert('There was an error subscribing to notifications.');
      }
    });
  }

  // === NEW METHODS FOR THE COUNTDOWN ===

  discountActiveNow(): boolean {
    const prod = this.product();
    const discount = prod.discount;
    console.log("DISSSSSSS = ", discount);
    console.log("discount.isActive = ", discount?.isActive);
    if (!discount?.isActive || !discount.startDate || !discount.endDate) {
      console.log("FALSE");
      return false;
    }
    const now   = new Date().getTime();
    const start = new Date(discount.startDate).getTime();
    const end   = new Date(discount.endDate).getTime();

    return now >= start && now <= end;
  }

  private startDiscountCountdown(): void {
    // Calculate once at startup
    this.updateDiscountTimeLeft();

    // Recalculate every second
    this.discountInterval = setInterval(() => {
      this.updateDiscountTimeLeft();
    }, 1000);
  }

  private updateDiscountTimeLeft(): void {
    const productEndDate = this.product().discount?.endDate;
    console.log("EndDate = ", productEndDate);
    if (!productEndDate) {
      return;
    }

    const now = new Date().getTime();
    const end = new Date(productEndDate).getTime();
    const distance = end - now;

    if (distance <= 0) {
      this.discountTimeLeft.set('Offer ended');
      clearInterval(this.discountInterval);

      const updatedProd = { ...this.product() };
      updatedProd.discount!.isActive = false;
      updatedProd.price = this.product().previousPrice ?? this.product().price
      this.product.set(updatedProd);
      this.cdRef.detectChanges();

      return;
    }

    // If discount is still active, compute the days/hours/min/sec left
    const days    = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    console.log("TIME =", days,hours,minutes,seconds);
    // Simple display format, e.g. "1d 04:22:11"
    if (days > 0) {
      this.discountTimeLeft.set(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    } else if(hours > 0) {
      this.discountTimeLeft.set(`${hours}h ${minutes}m ${seconds}s`);
    } else if(minutes > 0){
      this.discountTimeLeft.set(`${minutes}m ${seconds}s`);
    } else if(seconds > 0){
      this.discountTimeLeft.set(`${seconds}s`);
    }
  }
}
