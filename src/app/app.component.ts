import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { AccountService } from './core/services/account.service';
import { BasketService } from './core/services/basket.service';
import { StorageService } from './core/services/storage.service';
import { LOCAL_STORAGE_KEYS } from './shared/constants/auth';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterViewInit {
  isTesting = false;
  constructor(private basketService: BasketService,
    private accountService: AccountService,
    private storageService: StorageService) {
  }
  ngAfterViewInit(): void {
    if (!this.isTesting) {
      this.loadBasket();
      this.loadCurrentUser();
    }
  }

  ngOnInit() {

  }

  loadBasket() {
    const basketId = this.storageService.get<string>('basket_id');
    if (basketId) {
      this.basketService.getBasket(basketId).subscribe({
        error: error => { console.error(error); }
      });
    }
  }

  public loadCurrentUser() {
    const token = this.storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return;
    }
    this.accountService.loadCurrentUser(token).subscribe({
      error: (error: any) => { console.error(error); }
    });
  }
}
