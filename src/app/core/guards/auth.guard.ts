import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, map } from 'rxjs';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IUser } from 'src/app/shared/models/user';
import { AccountService } from '../services/account.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private accountService: AccountService, private router: Router, public dialog: MatDialog) {
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
          this.dialog.open(DialogComponent, { data: { title: "Access Denied!", content: "You don't have permission to view this page" } })
          this.router.navigate(['/'], { queryParams: { returnUrl: state.url } });
          return false;
        }
        return false;
      })
    );
  }
}
