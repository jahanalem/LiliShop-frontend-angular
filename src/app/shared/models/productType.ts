import { INameTranslation } from './localization';

export interface IProductType {
  id: number;
  name: string;
  isActive?: boolean;
  translations?: INameTranslation[];
}
