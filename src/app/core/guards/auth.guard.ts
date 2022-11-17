import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, map } from 'rxjs';
import { IUser } from 'src/app/shared/models/user';
import { AccountService } from '../services/account.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private accountService: AccountService, private router: Router) {

  }

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.accountService.currentUser$.pipe(
      map((authenticatedUser: IUser | null) => {
        let permissionKind: string[] | undefined = _route.data['access'] as string[];
        const authorization = permissionKind?.includes(authenticatedUser?.role ?? '');
        if ((authenticatedUser && !permissionKind) || authorization) {
          return true;
        }
        else if (!authenticatedUser) {
          this.router.navigate(['account/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
        else if (!authorization) {
          console.log("You don't have persmission for that.");
          this.router.navigate(['shop'], { queryParams: { returnUrl: state.url } });
          return false;
        }
        return false;
      })
    );
  }

}
