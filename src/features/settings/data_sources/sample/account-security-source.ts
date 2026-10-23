import type { AccountSecurity } from '@/features/settings/entities/account-security';

const sampleAccountSecuritySource = {
  find: (): AccountSecurity => ({
    email: 'you@example.com',
    passwordChangedLabel: '12 days ago',
    authenticatorAddedLabel: 'Oct 23, 2026',
    recoveryCodesRemaining: 7,
    recoveryCodesTotal: 10,
    signedInDeviceCount: 3,
  }),
};

export default sampleAccountSecuritySource;
