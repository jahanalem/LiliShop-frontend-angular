import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment, Route } from '@angular/router';

export const successMatchGuard: CanMatchFn = (_route: Route, _segments: UrlSegment[]) => {
  const router = inject(Router);

  const navigation = router.getCurrentNavigation();
  const extraState = navigation?.extras?.state;

  if (extraState && extraState['order']) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
