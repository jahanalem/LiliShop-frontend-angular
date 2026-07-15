import { inject } from '@angular/core';
import { Router, CanMatchFn, Route, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { AccountService } from '../services/account.service';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { IUser } from 'src/app/shared/models/user';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';



export const authGuard: CanMatchFn = (route: Route, segments: UrlSegment[]): Observable<boolean> => {
  const authorizationService = inject(AuthorizationService);
  const accountService = inject(AccountService);
  const router = inject(Router);
  const dialog = inject(MatDialog);
  const translationService = inject(TranslationService);

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
          showAccessDeniedDialog(dialog, translationService);
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

const showAccessDeniedDialog = (dialog: MatDialog, translationService: TranslationService): void => {
  dialog.open(DialogComponent, {
    data: {
      title: translationService.translate(TranslationKeys.Auth.AccessDeniedTitle),
      content: translationService.translate(TranslationKeys.Auth.AccessDeniedContent)
    },
  });
};

const redirectToHomePage = (router: Router, segments: UrlSegment[]): void => {
  router.navigate(['/'], { queryParams: { returnUrl: segments.map(segment => segment.path).join('/') } });
};
