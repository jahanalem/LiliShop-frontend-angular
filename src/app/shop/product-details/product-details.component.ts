import { of, switchMap } from 'rxjs';
import { ShopService } from './../shop.service';
import { IProduct } from 'src/app/shared/models/product';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { BreadcrumbService } from 'xng-breadcrumb';
import { BasketService } from 'src/app/basket/basket.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product!: IProduct;
  quantity: number = 1;

  constructor(private shopService: ShopService,
    private activatedRoute: ActivatedRoute,
    private bcService: BreadcrumbService,
    private basketService: BasketService) {

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
*/
  loadProduct() {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id'); // === this.activatedRoute.snapshot.paramMap.get('id')
        return id ? this.shopService.getProduct(+id) : of();
      })
    ).subscribe(product => {
      this.product = product;
      this.bcService.set('@productDetails', product.name);
    }, error => {
      console.log(error);
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
