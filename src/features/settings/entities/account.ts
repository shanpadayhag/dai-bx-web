import type { AccentColor, ThemeMode } from '@/core/appearance';

export const RECOVERY_CODE_TOTAL = 10;
export const LOW_RECOVERY_CODE_COUNT = 3;

export type AccountSecurity = {
  recoveryCodesRemaining: number;
  activeSessionCount: number;
};

export type AccountProfile = {
  name: string;
  email: string;
  accentColor: AccentColor;
  theme: ThemeMode;
};

export type Account = AccountProfile & {
  security: AccountSecurity;
};

export type ProfileChanges = Partial<Pick<AccountProfile, 'name' | 'accentColor' | 'theme'>>;

export type IdentityProof = {
  password: string;
  code: string;
};
