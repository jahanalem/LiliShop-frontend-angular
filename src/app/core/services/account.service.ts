import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { of, Observable, ReplaySubject, tap, map, catchError, throwError, finalize } from 'rxjs';
import { IAddress } from 'src/app/shared/models/address';
import { IUser } from 'src/app/shared/models/user';
import { IAuthenticatorSetup, IEnableAuthenticatorResult } from 'src/app/shared/models/mfa';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { LOCAL_STORAGE_KEYS } from 'src/app/shared/constants/auth';
import { UserQueryParams } from 'src/app/shared/models/userQueryParams';
import { IAdminAreaUser } from 'src/app/shared/models/adminAreaUser';
import { PaginationWithData, UserPagination } from 'src/app/shared/models/pagination';
import { IForgotPasswordResponse } from 'src/app/shared/models/forgotPasswordResponse';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storageService = inject(StorageService);

  private readonly baseUrl = environment.apiUrl;
  private currentUserSource = new ReplaySubject<IUser | null>(1);
  public currentUser$ = this.currentUserSource.asObservable();
  userQueryParams: UserQueryParams = new UserQueryParams();
  pagination = new PaginationWithData<IAdminAreaUser>();

  setUserQueryParams(params: UserQueryParams): void {
    this.userQueryParams = params;
  }

  getUserQueryParams(): UserQueryParams {
    return this.userQueryParams;
  }

  resetUserQueryParams() {
    this.userQueryParams = {} as UserQueryParams;
    return this.userQueryParams;
  }
  /**
  * Loads the current user based on the provided token and updates the user state.
  *
  * If the token is null, the current user state is set to null and an Observable
  * of null is returned. Otherwise, it sends a GET request to the server to fetch
  * the current user and updates the user state.
  *
  * @param {string | null} token - The authentication token.
  * @returns {Observable<IUser | null>} An Observable of the user object or null.
  */
  loadCurrentUser(token: string | null): Observable<IUser | null> {
    // If token is null, reset the current user state and return null.
    if (!token) {
      this.resetCurrentUserState();
      return of(null);
    }

    // Set up the Authorization header with the token.
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Make the HTTP request to fetch the current user.
    return this.http.get<IUser>(`${this.baseUrl}account/currentuser`, { headers }).pipe(
      tap((user: IUser) => {
        // If a user is returned, update the user state.
        if (user) {
          this.updateCurrentUserState(user);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  getUser(id: number): Observable<IAdminAreaUser> {
    return this.http.get<IAdminAreaUser>(`${this.baseUrl}account/user/${id}`);
  }

  getCurrentUser() {
    return this.http.get<IUser>(`${this.baseUrl}account/currentuser`).pipe(
      tap((user: IUser) => {
        this.currentUserSource.next(user);
      })
    );
  }

  getUsers(): Observable<UserPagination | null> {
    const token = this.storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return of(null);
    }

    let params = new HttpParams();

    const paramMappings: [keyof UserQueryParams, string][] = [
      ['pageNumber', 'pageIndex'],
      ['pageSize', 'pageSize'],
      ['sort', 'sort'],
      ['sortDirection', 'sortDirection'],
      ['search', 'search']
    ];
    paramMappings.forEach(([key, paramName]) => {
      const value = this.userQueryParams[key];
      if (value !== undefined && value !== 0 && value !== '') {
        params = params.append(paramName, value.toString());
      }
    });

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<UserPagination>(`${this.baseUrl}account/users`, { headers, observe: 'response', params }).pipe(
      map(response => response.body as UserPagination),
      tap(pagination => this.pagination = pagination),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

/**
 * Attempts to authenticate a user with their login credentials.
 *
 * A successful response does not always mean the user is fully authenticated.
 * For administrators, the backend may require an additional MFA step before
 * issuing a token.
 *
 * Only responses containing a real JWT token establish an authenticated session.
 * Pending MFA responses are returned to the caller unchanged so the UI can
 * continue the MFA flow.
 *
 * @param values The user's login credentials.
 * @returns The server's login response.
 */
  login(values: any): Observable<IUser> {
    return this.http.post<IUser>(`${this.baseUrl}account/login`, values).pipe(
      tap((user: IUser) => {
        // Only establish a session for a fully authenticated response. When the backend requires an
        // additional factor (admin MFA) it returns 200 with an EMPTY token plus a requiresTwoFactor* flag;
        // that is NOT an authenticated state and must not persist a (blank) token.
        if (this.isAuthenticatedUser(user)) {
          this.updateCurrentUserState(user);
        }
      })
    );
  }

  /**
   * True only for a fully authenticated login response (real token, no pending MFA step).
   * Returns a plain boolean (not a type predicate) so it never narrows an IUser argument to `never`.
   */
  isAuthenticatedUser(user: IUser | null | undefined): boolean {
    return !!user && !!user.token && !user.requiresTwoFactorSetup && !user.requiresTwoFactorCode;
  }

  /**
   * Begins authenticator (TOTP) enrolment. Credentials are re-verified server-side because an admin
   * being forced to enrol does not yet hold a token.
   */
  getAuthenticatorSetup(email: string, password: string): Observable<IAuthenticatorSetup> {
    return this.http.post<IAuthenticatorSetup>(`${this.baseUrl}account/mfa/setup`, { email, password });
  }

  /** Completes enrolment: verifies the first code, enables MFA, and returns one-time recovery codes. */
  enableAuthenticator(email: string, password: string, code: string): Observable<IEnableAuthenticatorResult> {
    return this.http.post<IEnableAuthenticatorResult>(`${this.baseUrl}account/mfa/enable`, { email, password, code });
  }

  isLoggedIn(): boolean {
    const token = this.storageService.get<string>(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  }

  /**
   * Registers a new user by sending their registration details to the server.
   *
   * This method sends a POST request to the server with the provided user registration details.
   * It returns an Observable containing the full HttpResponse, which includes both the
   * response body and the response metadata. Upon successful registration, the method
   * extracts the user data from the response body and updates the current user state.
   * This is typically used for actions like updating the user context in the application
   * or storing the user's credentials for future requests.
   *
   * @param {any} values - The user's registration details, typically including fields like
   *                       email, password, and any other necessary registration information.
   * @returns {Observable<HttpResponse<IUser>>} An Observable emitting the full HttpResponse
   *                                            from the registration request. The response body
   *                                            contains the registered IUser object.
   */
  register(values: any): Observable<HttpResponse<IUser>> {
    return this.http.post<IUser>(`${this.baseUrl}account/register`, values, { observe: 'response' }).pipe(
      tap(response => {
        const user = response.body;
        if (user) {
          this.updateCurrentUserState(user);
        }
      })
    );
  }

  /**
   * Logs out the current user.
   *
   * Deletes the user's authentication token from local storage, resets the
   * current user state to null, and navigates to the home page.
   */
  logout(): void {
    // Revoke the server-side session first (the request still needs the
    // token), but always clear local credentials — even if the call fails,
    // the token must not survive in this browser.
    this.http.post(`${this.baseUrl}account/logout`, {}).pipe(
      catchError(error => {
        console.error('Server-side logout failed', error);
        return of(null);
      }),
      finalize(() => {
        this.resetCurrentUserState();
        this.router.navigateByUrl('/account/login');
      })
    ).subscribe();
  }

  logoutFromAllDevices(): Observable<any> {
    return this.http.post(`${this.baseUrl}account/logout-from-all-devices`, {}).pipe(
      catchError(error => {
        console.error('Logout from all devices failed', error);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<string> {
    return this.http.post<{ accessToken: string }>(`${this.baseUrl}account/refresh-token`, {}).pipe(
      map((response) => response.accessToken),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  /**
 * Checks if the given email already exists in the system.
 *
 * Sends a GET request to the server to check if the email exists.
 *
 * @param {string} email - The email address to check.
 * @returns {Observable<boolean>} An Observable indicating whether the email exists.
 */
  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<boolean>(`${this.baseUrl}account/emailexists`, { params });
  }

  /**
   * Fetches the user's address from the server.
   *
   * Sends a GET request to the server to retrieve the user's address.
   *
   * @returns {Observable<IAddress>} An Observable of the user's address.
   */
  getUserAddress(): Observable<IAddress> {
    const url = `${this.baseUrl}account/address`;
    return this.http.get<IAddress>(url);
  }

  /**
   * Updates the user's address in the system.
   *
   * Sends a PUT request to the server to update the user's address.
   *
   * @param {IAddress} address - The new address details.
   * @returns {Observable<IAddress>} An Observable of the updated address.
   */
  updateAddress(address: IAddress): Observable<IAddress> {
    const url = `${this.baseUrl}account/address`;
    return this.http.put<IAddress>(url, address);
  }

  /**
   * Updates the current user state and stores the user's token in local storage.
   *
   * @param {IUser} user - The authenticated user object.
   */
  public updateCurrentUserState(user: IUser): void {
    this.storageService.set(LOCAL_STORAGE_KEYS.AUTH_TOKEN, user.token);
    this.currentUserSource.next(user);
  }

  /**
   * Resets the current user state to null.
   */
  private resetCurrentUserState(): void {
    this.storageService.delete(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    this.currentUserSource.next(null);
  }

  delete(userId: number): Observable<void> {
    const url = `${this.baseUrl}account/delete/${userId}`;
    return this.http.delete<void>(url)
      .pipe(catchError(error => {
        console.error(error);
        return throwError(() => error);
      }));
  }

  updateUser(userId: number, updatingUser: IAdminAreaUser): Observable<IAdminAreaUser> {
    const url = `${this.baseUrl}account/update-user/${userId}`;
    return this.http.put<IAdminAreaUser>(url, updatingUser).pipe(catchError(error => {
      console.error(error);
      return throwError(() => error);
    }));;
  }

  forgotPassword(email: string): Observable<IForgotPasswordResponse> {
    return this.http.post<IForgotPasswordResponse>(`${this.baseUrl}account/forgot-password/`, { email });
  }

  resetPassword(token: string, date: string, email: string, newPassword: string) {
    return this.http.post(`${this.baseUrl}account/reset-password/`, { token, date, email, newPassword });
  }

  LoginWithGoogle(credentials: string): Observable<IUser> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { token: credentials };
    return this.http.post<IUser>(this.baseUrl + "account/google-login", JSON.stringify(body), { headers: headers });
  }
}
