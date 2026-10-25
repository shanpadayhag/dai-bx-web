export type AuthenticatorSetup = {
  otpauthUri: string;
  manualEntryKey: string;
};

const OTPAUTH_LABEL_PATTERN = /^otpauth:\/\/totp\/[^:]+:([^?]+)/;

export const authenticatorAccountEmail = (authenticatorSetup: AuthenticatorSetup) => {
  const encodedAccountEmail = OTPAUTH_LABEL_PATTERN.exec(authenticatorSetup.otpauthUri)?.[1];
  return encodedAccountEmail === undefined ? null : decodeURIComponent(encodedAccountEmail);
};
