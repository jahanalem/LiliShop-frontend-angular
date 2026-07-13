import { INameTranslation } from './localization';

export interface IBrand {
  id: number;
  name: string;
  isActive?: boolean;
  translations?: INameTranslation[];
}
