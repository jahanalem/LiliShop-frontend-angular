import { describe, expect, it } from "vitest";
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { FormatValuePipe } from './format-value.pipe';
import { TranslationService } from 'src/app/core/i18n/translation.service';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

/** Stub that echoes the key so Yes/No is distinguishable without a loaded dictionary. */
class StubTranslationService {
  translate(key: string): string {
    return key === TranslationKeys.Common.Yes ? 'Yes' : key === TranslationKeys.Common.No ? 'No' : key;
  }
}

describe('FormatValuePipe — isActive', () => {
  function createPipe(): FormatValuePipe {
    TestBed.configureTestingModule({
      providers: [
        FormatValuePipe,
        { provide: LOCALE_ID, useValue: 'en-US' },
        { provide: TranslationService, useClass: StubTranslationService }
      ]
    });
    return TestBed.inject(FormatValuePipe);
  }

  it('reads the flag from the cell value when no row context is passed (brands, types, attributes)', () => {
    const pipe = createPipe();
    // Regression: these list tables call `value | formatValue:'isActive'` with no third arg.
    expect(pipe.transform(true, 'isActive')).toBe('Yes');
    expect(pipe.transform(false, 'isActive')).toBe('No');
  });

  it('reads the flag from the row context when one is passed (discounts, products)', () => {
    const pipe = createPipe();
    // Real call site: `row['isActive'] | formatValue:'isActive':row` — value and context agree.
    expect(pipe.transform(true, 'isActive', { isActive: true })).toBe('Yes');
    expect(pipe.transform(false, 'isActive', { isActive: false })).toBe('No');
  });
});
