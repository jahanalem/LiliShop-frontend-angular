import { IBaseEntity } from "./baseEntity";

export interface IContactUsMessage extends IBaseEntity {
  firstName: string;
  lastName : string;
  message  : string;
  email    : string;
}
