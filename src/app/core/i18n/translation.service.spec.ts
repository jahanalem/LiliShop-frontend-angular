import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { TestBed } from '@angular/core/testing';

import { TranslationService } from './translation.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { environment } from 'src/environments/environment';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    service = TestBed.inject(TranslationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function currentCulture(): string {
    return 'en'; // default resolution in the test environment (no stored language)
  }

  it('loads the dictionary for the current version', async () => {
    service.initialize();

    httpMock.expectOne(`${environment.apiUrl}localization/version`).flush({ version: 3 });
    await Promise.resolve();
    httpMock.expectOne(`${environment.apiUrl}localization/${currentCulture()}?v=3`)
      .flush({ culture: currentCulture(), version: 3, entries: { 'Common.Save': 'Save' } });
    await Promise.resolve();

    expect(service.translate('Common.Save')).toBe('Save');
    expect(service.version()).toBe(3);
  });

  it('serves the cached dictionary and skips the download when the version matches', async () => {
    localStorage.setItem(`ls-i18n:${currentCulture()}`, JSON.stringify({
      culture: currentCulture(), version: 5, entries: { 'Common.Save': 'Save (cached)' }
    }));

    service.initialize();

    expect(service.translate('Common.Save')).toBe('Save (cached)');
    httpMock.expectOne(`${environment.apiUrl}localization/version`).flush({ version: 5 });
    await Promise.resolve();
    // No dictionary request: the cache is current.
    httpMock.verify();
  });

  it('refreshes the dictionary when the version changed', async () => {
    localStorage.setItem(`ls-i18n:${currentCulture()}`, JSON.stringify({
      culture: currentCulture(), version: 5, entries: { 'Common.Save': 'Old' }
    }));

    service.initialize();
    httpMock.expectOne(`${environment.apiUrl}localization/version`).flush({ version: 6 });
    await Promise.resolve();
    httpMock.expectOne(`${environment.apiUrl}localization/${currentCulture()}?v=6`)
      .flush({ culture: currentCulture(), version: 6, entries: { 'Common.Save': 'New' } });
    await Promise.resolve();

    expect(service.translate('Common.Save')).toBe('New');
  });

  it('keeps the cached dictionary when the network fails', async () => {
    localStorage.setItem(`ls-i18n:${currentCulture()}`, JSON.stringify({
      culture: currentCulture(), version: 5, entries: { 'Common.Save': 'Cached' }
    }));

    service.initialize();
    httpMock.expectOne(`${environment.apiUrl}localization/version`).error(new ProgressEvent('error'));
    await Promise.resolve();

    expect(service.translate('Common.Save')).toBe('Cached');
  });

  it('returns the key for missing translations', () => {
    expect(service.translate('Does.Not.Exist')).toBe('Does.Not.Exist');
  });

  it('interpolates positional and named parameters', async () => {
    service.initialize();
    httpMock.expectOne(`${environment.apiUrl}localization/version`).flush({ version: 1 });
    await Promise.resolve();
    httpMock.expectOne(`${environment.apiUrl}localization/${currentCulture()}?v=1`)
      .flush({
        culture: currentCulture(), version: 1, entries: {
          'Footer.AllRightsReserved': '© {0} Lili Shop. All rights reserved.',
          'Basket.ItemCount': '{count} items in your basket',
        }
      });
    await Promise.resolve();

    expect(service.translate('Footer.AllRightsReserved', [2026])).toBe('© 2026 Lili Shop. All rights reserved.');
    expect(service.translate('Basket.ItemCount', { count: 3 })).toBe('3 items in your basket');
  });
});
