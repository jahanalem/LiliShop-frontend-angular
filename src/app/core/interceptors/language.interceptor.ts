import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LanguageService } from '../services/language.service';

/**
 * Sends the user's chosen language to the API on every request. The backend's
 * request-localization pipeline reads it (after the culture cookie) to set
 * CultureInfo.CurrentUICulture, so error messages and — later — translated
 * content come back in the right language.
 */
export const languageInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url.startsWith(environment.apiUrl)) {
    const languageService = inject(LanguageService);
    request = request.clone({
      setHeaders: { 'Accept-Language': languageService.currentCode() }
    });
  }

  return next(request);
};
