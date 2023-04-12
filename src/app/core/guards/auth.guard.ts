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
  constructor(
    private accountService: AccountService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const requiredRoles = route.data['access'] as string[] | undefined;

    return this.accountService.currentUser$.pipe(
      map((authenticatedUser: IUser | null) => {
        if (!authenticatedUser) {
          this.redirectToLoginPage(state.url);
          return false;
        }
        // If requiredRoles is undefined or falsy, it returns true because no specific role is required to access the page.
        //If requiredRoles is truthy (it contains one or more roles), then it calls the hasPermission method
        if (!requiredRoles || this.hasPermission(requiredRoles, authenticatedUser)) {
          return true;
        }

        this.showAccessDeniedDialog();
        this.redirectToHomePage(state.url);
        return false;
      })
    );
  }

  private hasPermission(permissionKind: string[], authenticatedUser: IUser): boolean {
    return permissionKind.includes(authenticatedUser.role);
  }

  private redirectToLoginPage(returnUrl: string): void {
    this.router.navigate(['account/login'], { queryParams: { returnUrl } });
  }

  private showAccessDeniedDialog(): void {
    this.dialog.open(DialogComponent, {
      data: { title: 'Access Denied!', content: "You don't have permission to view this page" },
    });
  }

  private redirectToHomePage(returnUrl: string): void {
    this.router.navigate(['/'], { queryParams: { returnUrl } });
  }
}
