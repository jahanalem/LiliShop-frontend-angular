export interface IBaseEntity
{
  id          : number;
  createdDate : string;
  modifiedDate: string;
}

// Utility type to hold the keys that should be omitted
export type BaseEntityKeys = 'id' | 'createdDate' | 'modifiedDate';
