import { NotificationService } from './../../../../core/services/notification.service';
import { of, switchMap } from 'rxjs';
import { IProduct } from 'src/app/shared/models/product';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { BreadcrumbService } from 'xng-breadcrumb';
import { BasketService } from 'src/app/core/services/basket.service';
import { ProductService } from 'src/app/core/services/product.service';
import { INotificationSubscription } from 'src/app/shared/models/notificationSubscription';
import { AccountService } from 'src/app/core/services/account.service';


@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailsComponent implements OnInit {
  product                   = signal<IProduct>({} as IProduct);
  quantity                  = signal<number>(1);
  isSubscribed              = signal<boolean>(false);
  currentUserId             = signal<number>(0);
  currentUserEmailConfirmed = signal<boolean>(false);

  private activatedRoute      = inject(ActivatedRoute);
  private bcService           = inject(BreadcrumbService);
  private basketService       = inject(BasketService);
  private productService      = inject(ProductService);
  private notificationService = inject(NotificationService);
  private accountService      = inject(AccountService);

  constructor() {
    this.bcService.set('@productDetails', ' ');
  }

  ngOnInit(): void {
    this.loadProduct();
    this.accountService.currentUser$.subscribe({
      next: (user) => {
        if (user && user.id) {
          this.currentUserId.set(user.id);
          this.currentUserEmailConfirmed.set(user.emailConfirmed);
        }
      }
    });
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
        const id = params.get('id'); // === this.activatedRoute.snapshot.paramMap.get('id')
        return id ? this.productService.getProduct(+id) : of();
      })
    ).subscribe({
      next: (product) => {
        this.product.set(product);
        this.bcService.set('@productDetails', product.name);
        this.checkSubscriptionStatus();
      },
      error: (error) => {
        console.error(error);
      }
    });

    // const id = this.activatedRoute.snapshot.paramMap.get('id');
    // if (!id) {
    //   return;
    // }
    // this.shopService.getProduct(+id).subscribe(product => {
    //   this.product = product;
    //   this.bcService.set('@productDetails', product.name);
    // }, error => {
    //   console.log(error);
    // });
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
        next: () => {
          this.isSubscribed.set(true);
        },
        error: (error: any) => {
          if (error.status === 404) {
            this.isSubscribed.set(false); // No subscription found
          } else {
            console.error(error); // Handle other errors
          }
        }
      });
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
}
