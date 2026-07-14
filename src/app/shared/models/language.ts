export interface ILanguage {
  code: string;
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
  /** ISO country codes this language is suggested for (first-visit detection). */
  countries: string[];
}
