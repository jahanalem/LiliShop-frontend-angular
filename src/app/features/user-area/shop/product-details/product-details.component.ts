import { of, switchMap } from 'rxjs';
import { IProduct } from 'src/app/shared/models/product';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { BreadcrumbService } from 'xng-breadcrumb';
import { BasketService } from 'src/app/core/services/basket.service';
import { ProductService } from 'src/app/core/services/product.service';


@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product!: IProduct;
  quantity: number = 1;

  constructor(private activatedRoute: ActivatedRoute,
    private bcService: BreadcrumbService,
    private basketService: BasketService,
    private productService: ProductService) {

    this.bcService.set('@productDetails', ' ');
  }

  ngOnInit(): void {
    this.loadProduct();
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
    ).subscribe(product => {
      this.product = product;
      this.bcService.set('@productDetails', product.name);
    }, error => {
      console.error(error);
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
    this.quantity++;
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addItemToBasket() {
    this.basketService.addItemToBasket(this.product, this.quantity);
  }
}
