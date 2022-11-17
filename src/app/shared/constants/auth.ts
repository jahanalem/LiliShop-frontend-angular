
export const ROLE = {
  SUPERADMIN: "SuperAdmin",
  ADMINISTRATOR: "Administrator",
  STANDARD: "Standard"
};
Object.freeze(ROLE);


export type permissionType = { [key: string]: string[] };

export const PERMISSION_KIND: permissionType = {
  DELETE_CAN:     [ROLE.SUPERADMIN],
  CREATE_CAN:     [ROLE.SUPERADMIN, ROLE.ADMINISTRATOR],
  UPDATE_CAN:     [ROLE.SUPERADMIN, ROLE.ADMINISTRATOR],
  PUBLIC_ACCESS:  [ROLE.SUPERADMIN, ROLE.ADMINISTRATOR, ROLE.STANDARD],
  PRIVATE_ACCESS: [ROLE.SUPERADMIN, ROLE.ADMINISTRATOR],
}
Object.freeze(PERMISSION_KIND);

export const PERMISSION_NAME = {
  DELETE_CAN: 'DELETE_CAN',
  CREATE_CAN: 'CREATE_CAN',
  UPDATE_CAN: 'UPDATE_CAN',
  PUBLIC_ACCESS: 'PUBLIC_ACCESS',
  PRIVATE_ACCESS: 'PRIVATE_ACCESS',
};
Object.freeze(PERMISSION_NAME);
