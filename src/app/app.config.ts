import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCloudinaryLoader } from '@angular/common';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { languageInterceptor } from './core/interceptors/language.interceptor';
import { LanguageService } from './core/services/language.service';
import { TranslationService } from './core/i18n/translation.service';
import { registerAppLocales } from './core/i18n/locale-registry';
import { LocalizedMatPaginatorIntl } from './core/i18n/localized-paginator-intl';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { BreadcrumbService } from 'xng-breadcrumb';
import { DatePipe } from '@angular/common';

registerAppLocales();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // Scroll to top on every route navigation (e.g. shop -> product details);
    // 'top' also restores position correctly on browser back/forward.
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideAnimations(),
    provideHttpClient(withXhr(), withInterceptors([languageInterceptor, jwtInterceptor, loadingInterceptor, errorInterceptor])),
    provideCloudinaryLoader('https://res.cloudinary.com/rouhi'),
    // Fetch the active languages and translations once at startup (non-blocking; the
    // translation dictionary applies its localStorage snapshot synchronously).
    provideAppInitializer(() => {
      inject(LanguageService).initialize();
      inject(TranslationService).initialize();
    }),
    // The user's language drives currency/date/number formatting. Bound at
    // bootstrap; LanguageService.setLanguage() reloads the app to re-evaluate it.
    {
      provide: LOCALE_ID,
      useFactory: () => inject(LanguageService).localeId()
    },
    // Paginator labels come from the same backend translation catalog as all UI text.
    { provide: MatPaginatorIntl, useClass: LocalizedMatPaginatorIntl },
    BreadcrumbService,
    DatePipe
  ]
};
