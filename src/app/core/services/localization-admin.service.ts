import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ILanguageAdmin,
  ILanguageCompletion,
  ILanguageUpsert,
  ILocalizationEntryPage,
  ILocalizationEntryUpsert,
} from 'src/app/shared/models/localization';

/**
 * Admin API for the translation management panel: system-translation CRUD, per-language
 * completion, missing keys, and language management. Every write bumps the global
 * translation version on the backend, so clients pick the change up on their next load —
 * no redeploy.
 */
@Injectable({ providedIn: 'root' })
export class LocalizationAdminService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getEntries(search: string | null, culture: string | null, pageIndex: number, pageSize: number): Observable<ILocalizationEntryPage> {
    let params = new HttpParams().set('pageIndex', pageIndex).set('pageSize', pageSize);
    if (search) {
      params = params.set('search', search);
    }
    if (culture) {
      params = params.set('culture', culture);
    }
    return this.http.get<ILocalizationEntryPage>(`${this.baseUrl}localization/admin/entries`, { params });
  }

  upsertEntry(entry: ILocalizationEntryUpsert): Observable<unknown> {
    return this.http.put(`${this.baseUrl}localization/admin/entries`, entry);
  }

  deleteEntry(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}localization/admin/entries/${id}`);
  }

  getCompletion(): Observable<ILanguageCompletion[]> {
    return this.http.get<ILanguageCompletion[]>(`${this.baseUrl}localization/admin/completion`);
  }

  getMissingKeys(culture: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}localization/admin/missing/${culture}`);
  }

  getAllLanguages(): Observable<ILanguageAdmin[]> {
    return this.http.get<ILanguageAdmin[]>(`${this.baseUrl}languages/admin`);
  }

  upsertLanguage(language: ILanguageUpsert): Observable<ILanguageAdmin> {
    return this.http.put<ILanguageAdmin>(`${this.baseUrl}languages/admin`, language);
  }
}
