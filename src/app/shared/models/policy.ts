export interface IPolicyDictionary {
  [key: string]: string[];
}

export const PolicyNames = {
  RequireSuperAdminRole: 'RequireSuperAdminRole',
  RequireAtLeastAdministratorRole: 'RequireAtLeastAdministratorRole',
  RequireAtLeastStandardRole: 'RequireAtLeastStandardRole'
};
