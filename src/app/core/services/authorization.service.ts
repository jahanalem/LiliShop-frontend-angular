import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IPolicyDictionary } from 'src/app/shared/models/policy';


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
