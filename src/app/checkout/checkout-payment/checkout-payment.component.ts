import { IOrder, IOrderToCreate } from './../../shared/models/order';
import { ToastrService } from 'ngx-toastr';
import { CheckoutService } from './../checkout.service';
import { BasketService } from 'src/app/basket/basket.service';
import { FormGroup } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { IBasket } from 'src/app/shared/models/basket';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-checkout-payment',
  templateUrl: './checkout-payment.component.html',
  styleUrls: ['./checkout-payment.component.scss']
})
export class CheckoutPaymentComponent implements OnInit {
  @Input() checkoutForm!: FormGroup;
  constructor(
    private basketService: BasketService,
    private checkoutService: CheckoutService,
    private toastr: ToastrService,
    private router: Router) { }

  ngOnInit(): void {
  }

  submitOrder() {
    const basket = this.basketService.getCurrentBasketValue();
    if (!basket) {
      return;
    }
    const orderToCreate = this.getOrderToCreate(basket);
    this.checkoutService.createOrder(orderToCreate).subscribe((order: IOrder) => {

      this.toastr.success('Order created successfully.');
      this.basketService.deleteLocalBasket(basket.id);

      const navigationExtras: NavigationExtras = { state: order };
      this.router.navigate(['checkout/success'], navigationExtras);
      
    }, error => {
      this.toastr.error(error);
      console.log(error)
    });
  }
  private getOrderToCreate(basket: IBasket): IOrderToCreate {
    return {
      basketId: basket.id,
      deliveryMethodId: this.checkoutForm.get('deliveryForm')?.get('deliveryMethod')?.value,
      shipToAddress: this.checkoutForm.get('addressForm')?.value
    } as IOrderToCreate;
  }
}
