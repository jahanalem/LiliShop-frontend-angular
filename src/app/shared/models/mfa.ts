// Response of POST account/mfa/setup — data needed to enrol an authenticator app.
export interface IAuthenticatorSetup {
  sharedKey: string;        // manual-entry key
  authenticatorUri: string; // otpauth:// URI to render as a QR code
}

// Response of POST account/mfa/enable — one-time recovery codes, shown exactly once.
export interface IEnableAuthenticatorResult {
  recoveryCodes: string[];
}
