import type { AuthenticatorSetup } from '@/features/auth/entities/authenticator-setup';

const sampleManualKey = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

const sampleAuthenticatorSetupSource = {
  find: (): AuthenticatorSetup => ({
    accountEmail: 'you@example.com',
    otpauthUri: `otpauth://totp/DaiBX:you%40example.com?secret=${sampleManualKey}&issuer=DaiBX&digits=6&period=30`,
    manualKey: sampleManualKey,
  }),
};

export default sampleAuthenticatorSetupSource;
