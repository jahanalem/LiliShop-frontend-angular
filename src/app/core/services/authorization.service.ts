import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IPolicyDictionary, PolicyNames } from 'src/app/shared/models/policy';
import { AccountService } from './account.service';
import { ToastrService } from 'ngx-toastr';

export enum Action {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete'
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private readonly baseUrl = environment.apiUrl;
  private policies$ = new BehaviorSubject<IPolicyDictionary | null>(null);

  constructor(
    private http: HttpClient,
    private accountService: AccountService,
    private toastr: ToastrService
  ) { }

  getPolicies(): Observable<IPolicyDictionary> {
    const url = `${this.baseUrl}authorization/policies/`;
    return this.http.get<IPolicyDictionary>(url).pipe(
      tap(policies => this.policies$.next(policies))
    );
  }

  getPolicy(policyName: string): Observable<string[]> {
    return this.policies$.getValue()
      ? this.fetchPolicyFromCache(policyName)
      : this.fetchPolicyFromServer(policyName);
  }

  isCurrentUserAuthorized(policyName: PolicyNames, currentUserRole: string | null = null): Observable<boolean> {
    if (currentUserRole) {
      return this.isRoleAllowedInPolicy(policyName, currentUserRole);
    }
    else {
      return this.accountService.currentUser$.pipe(
        switchMap(user => {
          if (user) {
            return this.isRoleAllowedInPolicy(policyName, user.role);
          } else {
            return of(false);
          }
        })
      );
    }
  }

  private handleAuthorizationError(action: Action): void {
    this.toastr.error(`You are not authorized to perform this action: ${action}`, 'Unauthorized');
  }

  isActionAllowed(action: Action, userRole: string): Observable<boolean> {
    const policyName = this.getPolicyNameForAction(action) as PolicyNames;
    return this.isRoleAllowedInPolicy(policyName, userRole).pipe(
      catchError(_error => {
        this.handleAuthorizationError(action);
        return of(false);
      })
    );
  }

  private isRoleAllowedInPolicy(policyName: PolicyNames, role: string): Observable<boolean> {
    return this.getPolicy(policyName).pipe(
      map(allowedRoles => allowedRoles.includes(role))
    ).pipe(tap(response=>console.log("response = ", response)));
  }

  private getPolicyNameForAction(action: Action): string {
    switch (action) {
      case Action.Create:
      case Action.Update:
        return PolicyNames.RequireAtLeastAdministratorRole;
      case Action.Delete:
        return PolicyNames.RequireSuperAdminRole;
      default:
        throw new Error(`No policy defined for action: ${action}`);
    }
  }

  private fetchPolicyFromCache(policyName: string): Observable<string[]> {
    return this.policies$.asObservable().pipe(
      map(policies => policies ? (policies[policyName] || []) : [])
    );
  }

  private fetchPolicyFromServer(policyName: string): Observable<string[]> {
    return this.getPolicies().pipe(
      map(policies => policies[policyName] || [])
    );
  }
}
