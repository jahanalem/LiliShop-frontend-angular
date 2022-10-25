import { IBasket } from './../../shared/models/basket';
import { Observable, of } from 'rxjs';
import { BasketService } from './../../basket/basket.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {
  public isCollapsed = true;
  basket$: Observable<IBasket | null> = of(null);

  constructor(private basketService: BasketService) { }

  ngOnInit(): void {
    if (this.basketService.basket$)
      this.basket$ = this.basketService.basket$;
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
