import { IPaginationWithData } from './pagination';

export interface ILocalizationEntry {
  id: number;
  key: string;
  culture: string;
  value: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface ILanguageCompletion {
  culture: string;
  translatedKeys: number;
  totalKeys: number;
  percent: number;
}

export interface ILocalizationEntryUpsert {
  key: string;
  culture: string;
  value: string;
}

export interface ILanguageAdmin {
  id: number;
  code: string;
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

export interface ILanguageUpsert {
  id?: number;
  code: string;
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

export interface INameTranslation {
  culture: string;
  name: string;
}

export interface IProductTranslation {
  culture: string;
  name: string;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export type ILocalizationEntryPage = IPaginationWithData<ILocalizationEntry>;
