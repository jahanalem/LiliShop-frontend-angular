export interface IUser {
  id            ?: number
  email         :  string;
  displayName   :  string;
  role          :  string;
  token         :  string;
  emailConfirmed:  boolean;
}
