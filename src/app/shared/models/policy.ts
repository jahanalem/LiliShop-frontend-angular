export interface IPolicyDictionary {
  [key: string]: string[];
}

export enum PolicyNames {
  RequireSuperAdminRole           = 'RequireSuperAdminRole',
  RequireAtLeastAdministratorRole = 'RequireAtLeastAdministratorRole',
  RequireAtLeastStandardRole      = 'RequireAtLeastStandardRole'
};
