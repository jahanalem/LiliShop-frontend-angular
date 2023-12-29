import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { AccountService } from '../services/account.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { IUser } from 'src/app/shared/models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {

  constructor(
    private accountService: AccountService,
    private authorizationService: AuthorizationService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const policyName = route.data['policy'] as string | undefined;

    if (!policyName) {
      // If no policy is specified, allow access
      return of(true);
    }

    return this.authorizationService.getPolicy(policyName).pipe(
      switchMap(requiredRoles => {
        return this.accountService.currentUser$.pipe(
          map((authenticatedUser: IUser | null) => {
            if (!authenticatedUser) {
              this.redirectToLoginPage(state.url);
              return false;
            }
            if (this.hasPermission(requiredRoles, authenticatedUser)) {
              return true;
            }
            this.showAccessDeniedDialog();
            this.redirectToHomePage(state.url);
            return false;
          })
        );
      })
    );
  }

  private hasPermission(requiredRoles: string[], authenticatedUser: IUser): boolean {
    return requiredRoles.includes(authenticatedUser.role);
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
