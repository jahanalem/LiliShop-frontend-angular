import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { TestBed } from '@angular/core/testing';

import { LanguageService } from './language.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ILanguage } from 'src/app/shared/models/language';

const LANGUAGES: ILanguage[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', direction: 'ltr', isDefault: true, countries: ['US', 'GB'] },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', direction: 'ltr', isDefault: false, countries: ['DE', 'AT'] },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', direction: 'rtl', isDefault: false, countries: ['IR'] },
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

  describe('first-visit language detection', () => {
    function initializeWithTimezone(timezone: string | undefined): { reload: ReturnType<typeof vi.fn> } {
      const reload = vi.fn();
      vi.spyOn(service as any, 'reloadApp').mockImplementation(reload);
      vi.spyOn(service, 'getTimezone').mockReturnValue(timezone);
      service.initialize();
      httpMock.expectOne(`${environment.apiUrl}languages`).flush(LANGUAGES);
      return { reload };
    }

    it('selects the language of the device country on a true first visit (Iran → fa)', () => {
      const { reload } = initializeWithTimezone('Asia/Tehran');

      const stored = JSON.parse(localStorage.getItem('ls-lang')!);
      expect(stored.code).toBe('fa');
      expect(stored.source).toBe('detected');
      expect(reload).toHaveBeenCalled();
    });

    it('never overrides an explicit user choice (priority 1 beats geo)', () => {
      localStorage.setItem('ls-lang', JSON.stringify({ code: 'en', dir: 'ltr', source: 'user' }));
      const { reload } = initializeWithTimezone('Asia/Tehran');

      expect(JSON.parse(localStorage.getItem('ls-lang')!).code).toBe('en');
      expect(reload).not.toHaveBeenCalled();
    });

    it('falls through to the browser/default language for unmapped timezones', () => {
      const before = service.currentCode();
      const { reload } = initializeWithTimezone('Etc/UTC');

      expect(service.currentCode()).toBe(before);
      expect(reload).not.toHaveBeenCalled();
    });

    it('applies the profile language on a fresh device after login', () => {
      const reload = vi.fn();
      vi.spyOn(service as any, 'reloadApp').mockImplementation(reload);
      service.initialize();
      httpMock.expectOne(`${environment.apiUrl}languages`).flush(LANGUAGES);

      service.applyProfileLanguage('de');

      const stored = JSON.parse(localStorage.getItem('ls-lang')!);
      expect(stored.code).toBe('de');
      expect(stored.source).toBe('user');
      expect(reload).toHaveBeenCalled();
    });

    it('keeps the local explicit choice over the profile language', () => {
      localStorage.setItem('ls-lang', JSON.stringify({ code: 'fa', dir: 'rtl', source: 'user' }));
      const reload = vi.fn();
      vi.spyOn(service as any, 'reloadApp').mockImplementation(reload);

      service.applyProfileLanguage('de');

      expect(JSON.parse(localStorage.getItem('ls-lang')!).code).toBe('fa');
      expect(reload).not.toHaveBeenCalled();
    });
  });
});
