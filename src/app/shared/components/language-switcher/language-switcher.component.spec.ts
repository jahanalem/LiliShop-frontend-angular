import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LanguageSwitcherComponent } from './language-switcher.component';
import { LanguageService } from 'src/app/core/services/language.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { ILanguage } from 'src/app/shared/models/language';

const LANGUAGES: ILanguage[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', direction: 'ltr', isDefault: true, countries: [] },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', direction: 'ltr', isDefault: false, countries: [] },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', direction: 'rtl', isDefault: false, countries: [] },
];

describe('LanguageSwitcherComponent', () => {
  let fixture: ComponentFixture<LanguageSwitcherComponent>;

  const languageServiceMock = {
    languages: signal<ILanguage[]>(LANGUAGES),
    currentCode: signal<string>('de'),
    setLanguage: () => {},
  };

  beforeEach(async () => {
    languageServiceMock.languages.set(LANGUAGES);
    languageServiceMock.currentCode.set('de');

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [
        { provide: LanguageService, useValue: languageServiceMock },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the native name of the current language beside the icon', () => {
    const name: HTMLElement = fixture.nativeElement.querySelector('.language-name');
    expect(name).toBeTruthy();
    expect(name.textContent?.trim()).toBe('Deutsch');
  });

  it('updates the displayed name when the language changes', () => {
    languageServiceMock.currentCode.set('fa');
    fixture.detectChanges();

    const name: HTMLElement = fixture.nativeElement.querySelector('.language-name');
    expect(name.textContent?.trim()).toBe('فارسی');
  });

  it('falls back to the uppercased code until the language list has loaded', () => {
    languageServiceMock.languages.set([
      { code: 'en', nativeName: 'English', englishName: 'English', direction: 'ltr', isDefault: true, countries: [] },
      { code: 'sv', nativeName: 'Svenska', englishName: 'Swedish', direction: 'ltr', isDefault: false, countries: [] },
    ]);
    languageServiceMock.currentCode.set('xx');
    fixture.detectChanges();

    const name: HTMLElement = fixture.nativeElement.querySelector('.language-name');
    expect(name.textContent?.trim()).toBe('XX');
  });

  it('renders nothing when fewer than two languages are active', () => {
    languageServiceMock.languages.set([LANGUAGES[0]]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.language-trigger')).toBeNull();
  });
});
