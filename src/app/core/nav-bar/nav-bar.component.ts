
import { IBasket } from './../../shared/models/basket';
import { Observable, of } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { IUser } from 'src/app/shared/models/user';
import { BasketService } from '../services/basket.service';
import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {
  public isCollapsed = true;
  basket$: Observable<IBasket | null> = of(null);
  currentUser$: Observable<IUser | null> = of(null);

  constructor(private basketService: BasketService, private accountService: AccountService) { }

  ngOnInit(): void {
    this.basket$ = this.basketService.basket$;
    this.currentUser$ = this.accountService.currentUser$;
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.accountService.logout();
  }
}
