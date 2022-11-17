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
      map((auth: IUser | null) => {
        let access: string[] | undefined = _route.data['access'] as string[];
        const authorization = access?.includes(auth?.role ?? '');
        if ((auth && !access) || authorization) {
          return true;
        }
        this.router.navigate(['account/login'], { queryParams: { returnUrl: state.url } });

        return false;
      })
    );
  }

}
