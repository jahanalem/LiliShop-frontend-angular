import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SuccessGuard implements CanActivate {
  constructor(private router: Router) {

  }
  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    const navigation = this.router.getCurrentNavigation();
    const extraState = navigation?.extras?.state;
    if (extraState && extraState['order']) {
      return true;
    }
    this.router.navigate(['/']);
    return false;
  }
}
