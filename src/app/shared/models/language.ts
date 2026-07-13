export interface ILanguage {
  code: string;
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
}
