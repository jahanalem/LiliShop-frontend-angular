import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IPolicyDictionary, PolicyNames } from 'src/app/shared/models/policy';

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

  constructor(private http: HttpClient) { }

  getPolicies(): Observable<IPolicyDictionary> {
    const url = `${this.baseUrl}authorization/policies/`;
    return this.http.get<IPolicyDictionary>(url).pipe(
      map(policies => {
        this.policies$.next(policies);
        return policies;
      })
    );
  }

  getPolicy(policyName: string): Observable<string[]> {
    return this.policies$.getValue()
      ? this.fetchPolicyFromCache(policyName)
      : this.fetchPolicyFromServer(policyName);
  }

  isRoleAllowedInPolicy(role: string, policyName: string): Observable<boolean> {
    return this.getPolicy(policyName).pipe(
      map(allowedRoles => allowedRoles.includes(role))
    );
  }

  isActionAllowed(action: Action, userRole: string): Observable<boolean> {
    const policyName = this.getPolicyNameForAction(action);
    return this.isRoleAllowedInPolicy(userRole, policyName);
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
