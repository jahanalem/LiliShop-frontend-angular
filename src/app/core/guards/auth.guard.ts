import { inject } from '@angular/core';
import { Router, CanMatchFn, Route, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { AccountService } from '../services/account.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { IUser } from 'src/app/shared/models/user';



export const authGuard: CanMatchFn = (route: Route, segments: UrlSegment[]): Observable<boolean> => {
  const authorizationService = inject(AuthorizationService);
  const accountService = inject(AccountService);
  const router = inject(Router);
  const dialog = inject(MatDialog);

  const policyName = route.data?.['policy'] as string | undefined;

  // Authentication is always required on guarded routes; a policy only adds
  // a role check on top. Without this, routes guarded but missing a policy
  // (e.g. checkout, orders) would be reachable anonymously.
  return accountService.currentUser$.pipe(
    switchMap((authenticatedUser: IUser | null) => {
      if (!authenticatedUser) {
        redirectToLoginPage(router, segments);
        return of(false);
      }

      if (!policyName) {
        return of(true);
      }

      return authorizationService.getPolicy(policyName).pipe(
        map(requiredRoles => {
          if (hasPermission(requiredRoles, authenticatedUser)) {
            return true;
          }
          showAccessDeniedDialog(dialog);
          redirectToHomePage(router, segments);
          return false;
        })
      );
    })
  );
}

const hasPermission = (requiredRoles: string[], authenticatedUser: IUser): boolean => {
  return requiredRoles.includes(authenticatedUser.role);
};

const redirectToLoginPage = (router: Router, segments: UrlSegment[]): void => {
  const returnUrl = segments.map(segment => segment.path).join('/');
  router.navigate(['account/login'], { queryParams: { returnUrl } });
};

const showAccessDeniedDialog = (dialog: MatDialog): void => {
  dialog.open(DialogComponent, {
    data: { title: 'Access Denied!', content: "You don't have permission to view this page" },
  });
};

const redirectToHomePage = (router: Router, segments: UrlSegment[]): void => {
  router.navigate(['/'], { queryParams: { returnUrl: segments.map(segment => segment.path).join('/') } });
};
