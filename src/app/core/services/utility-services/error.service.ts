import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private router: Router, private toastr: ToastrService) { }

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


    this.toastr.error(message, `Error ${response.status}`);
  }

  handleNotFound() {
    this.toastr.error('The resource was not found.', '404 Error');
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
