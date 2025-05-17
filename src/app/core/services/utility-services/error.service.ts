import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private notificationService = inject(NotificationService);
  private router              = inject(Router);

  constructor() { }

  handleError(response: HttpErrorResponse) {
    let defaultErrorMessage = "An error occurred";
    const error = response.error || {};

    switch (response.status) {
      case 400:
        defaultErrorMessage = this.getBadRequestMessage(error);
        break;
      case 401:
        defaultErrorMessage = error.title || "Unauthorized";
        break;
      case 403:
        defaultErrorMessage = "Access denied. You do not have permission to perform this action.";
        break;
      case 404:
        this.handleNotFound();
        return;
      case 500:
        defaultErrorMessage = "A server error occurred. Please try again later.";
        break;
      default:
        defaultErrorMessage = response.message || defaultErrorMessage;
        break;
    }

    const message = error.title || defaultErrorMessage;

    this.notificationService.showError(`Error ${response.status}: ${message}`);
  }

  handleNotFound() {
    this.notificationService.showError('404 Error: The resource was not found.');
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
      return error.message || "Bad Request";
    }
  }
}
