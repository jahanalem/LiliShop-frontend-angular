export interface IUser {
  id            ?: number
  email         :  string;
  displayName   :  string;
  role          :  string;
  token         :  string;                    // '' whenever an MFA step is pending — never treat '' as authenticated
  emailConfirmed:  boolean;
  requiresTwoFactorSetup?: boolean;           // admin has not enrolled an authenticator yet
  requiresTwoFactorCode ?: boolean;           // admin enrolled; a TOTP / recovery code is required
}
