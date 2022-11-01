import { ToastrService } from 'ngx-toastr';
import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BasketService } from 'src/app/basket/basket.service';
import { IBasket } from 'src/app/shared/models/basket';

@Component({
  selector: 'app-checkout-review',
  templateUrl: './checkout-review.component.html',
  styleUrls: ['./checkout-review.component.scss']
})
export class CheckoutReviewComponent implements OnInit {
  basket$: Observable<IBasket | null> = of(null);
  constructor(private basketService: BasketService, private toastrService: ToastrService) { }

  ngOnInit(): void {
    this.basket$ = this.basketService.basket$;
  }

  createPaymentIntent() {
    this.basketService.createPaymentIntent().subscribe((response: any) => {
      this.toastrService.success("Payment intent created.");
    }, error => {
      console.log(error);
      this.toastrService.error(error.message);
    });
  }
}
