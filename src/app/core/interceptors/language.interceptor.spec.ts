import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { TestBed } from '@angular/core/testing';

import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { languageInterceptor } from './language.interceptor';
import { LanguageService } from '../services/language.service';
import { environment } from 'src/environments/environment';

describe('languageInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptors([languageInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('adds the Accept-Language header to API requests', () => {
    TestBed.inject(LanguageService).currentCode.set('de');

    http.get(`${environment.apiUrl}products`).subscribe();

    const request = httpMock.expectOne(`${environment.apiUrl}products`);
    expect(request.request.headers.get('Accept-Language')).toBe('de');
    request.flush([]);
  });

  it('leaves non-API requests untouched', () => {
    http.get('https://res.cloudinary.com/some-image').subscribe();

    const request = httpMock.expectOne('https://res.cloudinary.com/some-image');
    expect(request.request.headers.has('Accept-Language')).toBe(false);
    request.flush({});
  });
});
