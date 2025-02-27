import { Component, AfterViewInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AccountService } from './core/services/account.service';
import { BasketService } from './core/services/basket.service';
import { StorageService } from './core/services/storage.service';
import { LOCAL_STORAGE_KEYS } from './shared/constants/auth';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class AppComponent implements AfterViewInit {
  isTesting = false;

  private basketService  = inject(BasketService);
  private accountService = inject(AccountService);
  private storageService = inject(StorageService);

  constructor() {

  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isTesting) {
      await Promise.all([
        await this.loadBasket(),
        await this.loadCurrentUser()
      ])
    }
  }

  async loadBasket(): Promise<void> {
    const basketId = this.storageService.get<string>('basket_id');
    if (!basketId) {
      return;
    }
    try {
      await firstValueFrom(this.basketService.getBasket(basketId));
    } catch (error) {
      console.error('Error loading shopping cart:', error);
    }
  }

  private async loadCurrentUser(): Promise<void> {
    const token = this.storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return;
    }
    try {
      await firstValueFrom(this.accountService.loadCurrentUser(token));
    }
    catch (error) {
      console.error('Error loading current user:', error);
    }
  }
}
