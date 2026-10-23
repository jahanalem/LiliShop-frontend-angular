import { RouterModule } from '@angular/router';
import { Component, AfterViewInit, ChangeDetectionStrategy, Injector, inject } from '@angular/core';
import { AccountService } from './core/services/account.service';
import { BasketService } from './core/services/basket.service';
import { StorageService } from './core/services/storage.service';
import { IconService } from './core/services/icon.service';
import { LOCAL_STORAGE_KEYS } from './shared/constants/auth';
import { firstValueFrom } from 'rxjs';
import { ShopCurrencyService } from './core/services/shop-currency.service';
import { TranslationService } from './core/i18n/translation.service';
import { unavailableCurrency } from './shared/pipes/money.pipe';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterModule]
})
export class AppComponent implements AfterViewInit {
  readonly shopCurrency = inject(ShopCurrencyService);
  private readonly injector = inject(Injector);

  currencyErrorMessage(): string {
    return unavailableCurrency(this.injector.get(TranslationService));
  }

  isTesting = false;

  private basketService  = inject(BasketService);
  private accountService = inject(AccountService);
  private storageService = inject(StorageService);
  private iconService    = inject(IconService);

  constructor() {
    this.iconService.registerBrandIcons();
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

  async loadCurrentUser(): Promise<void> {
    const token = this.storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    // Publish anonymous state as well, so direct guarded navigation can finish.
    try {
      await firstValueFrom(this.accountService.loadCurrentUser(token));
    }
    catch (error) {
      console.error('Error loading current user:', error);
    }
  }
}
