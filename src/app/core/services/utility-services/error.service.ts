import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';
import { TranslationService } from '../../i18n/translation.service';
import { TranslationKeys } from '../../i18n/translation-keys';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private notificationService = inject(NotificationService);
  private translationService  = inject(TranslationService);
  private router              = inject(Router);

  constructor() { }

  handleError(response: HttpErrorResponse) {
    // The backend localizes ProblemDetails (title/detail) for the request culture, so a
    // server-provided message always wins; the ClientError.* keys cover the cases where
    // the response carries no usable body.
    let defaultErrorMessage = this.translationService.translate(TranslationKeys.ClientError.Unexpected);
    const error = response.error || {};

    switch (response.status) {
      case 400:
        defaultErrorMessage = this.getBadRequestMessage(error);
        break;
      case 401:
        defaultErrorMessage = error.title || 'Unauthorized';
        break;
      case 403:
        defaultErrorMessage = this.translationService.translate(TranslationKeys.ClientError.AccessDenied);
        break;
      case 404:
        this.handleNotFound();
        return;
      case 429:
        // Rate limited. The throttling middleware returns an empty body, so rely on the status.
        this.notificationService.showError(this.translationService.translate(TranslationKeys.ClientError.TooManyRequests));
        return;
      case 500:
        defaultErrorMessage = this.translationService.translate(TranslationKeys.ClientError.ServerError);
        break;
      default:
        defaultErrorMessage = response.message || defaultErrorMessage;
        break;
    }

    const message = error.detail || error.title || defaultErrorMessage;

    this.notificationService.showError(`Error ${response.status}: ${message}`);
  }

  handleNotFound() {
    this.notificationService.showError(this.translationService.translate(TranslationKeys.ClientError.NotFound));
    this.router.navigateByUrl('/not-found');
  }

  private getBadRequestMessage(error: any): string {
    if (error.errors) {
      const modalStateErrors = [];
      for (const key in error.errors) {
        if (error.errors[key]) {
          modalStateErrors.push(error.errors[key]);
        }
      }
      return modalStateErrors.flat().join('\n');
    } else {
      return error.detail || error.message || 'Bad Request';
    }
  }
}
