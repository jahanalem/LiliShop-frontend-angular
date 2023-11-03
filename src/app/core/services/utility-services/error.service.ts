import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private router: Router, private toastr: ToastrService) { }

  handleError(response: HttpErrorResponse) {
    let message = "An error occurred.";
    const error = response.error;

    switch (response.status) {
      case 400:
        message = this.getBadRequestMessage(error);
        break;
      case 401:
        message = error.message || "Unauthorized";
        break;
      case 403:
        message = "Access denied. You do not have permission to perform this action.";
        break;
      case 404:
        this.handleNotFound();
        return;
      case 500:
        this.handleServerError(error);
        return;
      default:
        break;
    }

    this.toastr.error(message, `Error ${response.status}`);
  }

  handleNotFound() {
    this.toastr.error('The resource was not found.', '404 Error');
    this.router.navigateByUrl('/not-found');
  }

  handleServerError(error: any) {
    this.toastr.error('A server error occurred.', '500 Error');

    const navigationExtras: NavigationExtras = { state: { error } };
    this.router.navigateByUrl('/server-error', navigationExtras);
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
