import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { TestBed } from '@angular/core/testing';

import { LanguageService } from './language.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ILanguage } from 'src/app/shared/models/language';

const LANGUAGES: ILanguage[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', direction: 'ltr', isDefault: true },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', direction: 'ltr', isDefault: false },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', direction: 'rtl', isDefault: false },
];

describe('LanguageService', () => {
  let service: LanguageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    service = TestBed.inject(LanguageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function flushLanguages(languages: ILanguage[] = LANGUAGES): void {
    service.initialize();
    httpMock.expectOne(`${environment.apiUrl}languages`).flush(languages);
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads the active languages from the API', () => {
    flushLanguages();
    expect(service.languages().length).toBe(3);
  });

  it('keeps the current language when the API call fails', () => {
    const before = service.currentCode();
    service.initialize();
    httpMock.expectOne(`${environment.apiUrl}languages`).error(new ProgressEvent('error'));
    expect(service.currentCode()).toBe(before);
  });

  it('reports rtl direction for Persian', () => {
    flushLanguages();
    service.currentCode.set('fa');
    expect(service.currentDirection()).toBe('rtl');
    expect(service.isRtl()).toBe(true);
  });

  it('reports ltr direction for German', () => {
    flushLanguages();
    service.currentCode.set('de');
    expect(service.currentDirection()).toBe('ltr');
  });

  it('falls back to the default language when the persisted code is not active', () => {
    localStorage.setItem('ls-lang', JSON.stringify({ code: 'xx', dir: 'ltr' }));
    // Re-create the service so it resolves its initial code from storage.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    service = TestBed.inject(LanguageService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.currentCode()).toBe('xx');
    flushLanguages();
    expect(service.currentCode()).toBe('en');
  });

  it('maps unregistered locales to English formatting', () => {
    service.currentCode.set('xx');
    expect(service.localeId()).toBe('en');
    service.currentCode.set('de');
    expect(service.localeId()).toBe('de');
  });
});
