import { Injectable, Injector, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { normalizeCurrency } from 'src/app/shared/currency';

/** Current catalog currency, reloaded from the backend on every application start. */
@Injectable({ providedIn: 'root' })
export class ShopCurrencyService {
  private readonly injector = inject(Injector);
  private readonly current = signal<string | null>(null);
  private readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  private initialized = false;
  readonly currency = this.current.asReadonly();
  readonly state = this.status.asReadonly();

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    // Resolve HTTP at initialization so formatters can read the initial empty state without starting requests.
    this.injector.get(HttpClient).get<{ currency?: unknown }>(`${environment.apiUrl}shop/currency`).subscribe({
      next: config => {
        const code = normalizeCurrency(config?.currency);
        this.current.set(code);
        this.status.set(code ? 'ready' : 'error');
      },
      error: () => {
        this.current.set(null);
        this.status.set('error');
      }
    });
  }
}
