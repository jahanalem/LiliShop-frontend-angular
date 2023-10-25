export interface IAdminAreaUser {
  id                  ?: number
  email               :  string;
  displayName         :  string;
  roleName            :  string;
  emailConfirmed      ?: boolean;
  phoneNumber         ?: string;
  phoneNumberConfirmed:  boolean;
  lockoutEnd          ?: Date;
  lockoutEnabled      ?: boolean;
  accessFailedCount   ?: number
}

export class AdminAreaUser implements IAdminAreaUser {
  id                  ?: number;
  email!              :  string;
  displayName!        :  string;
  roleName!           :  string;
  emailConfirmed      :  boolean = false;
  phoneNumber         ?: string;
  phoneNumberConfirmed:  boolean = false;
  lockoutEnd          ?: Date;
  lockoutEnabled      :  boolean = false;
  accessFailedCount   :  number = 0;

  constructor(init?: Partial<AdminAreaUser>) {
    Object.assign(this, init);
  }
}
