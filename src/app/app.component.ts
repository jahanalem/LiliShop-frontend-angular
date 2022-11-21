import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AccountService } from './core/services/account.service';
import { BasketService } from './core/services/basket.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'LiliShop';

  constructor(private basketService: BasketService, private accountService: AccountService) {
  }
  ngAfterViewInit(): void {
    this.loadBasket();
    this.loadCurrentUser();
  }

  ngOnInit() {

  }

  loadBasket() {
    const basketId = localStorage.getItem('basket_id');
    if (basketId) {
      this.basketService.getBasket(basketId).subscribe(() => {
      }, error => {
        console.log(error);
      });
    }
  }

  private loadCurrentUser() {
    const token = localStorage.getItem('token');
    this.accountService.loadCurrentUser(token).subscribe(() => {
    }, (error: any) => {
      console.log(error);
    });
  }
}
