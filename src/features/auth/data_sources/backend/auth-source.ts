import apiClient from '@/core/api/api-client';
import UnauthorizedHandling from '@/core/api/unauthorized-handling';
import type { AuthenticatorSetup } from '@/features/auth/entities/authenticator-setup';
import type { NextStepAnswer } from '@/features/auth/entities/next-step';
import type SignedInAnswer from '@/features/auth/entities/signed-in-answer';

type StatusAnswer = {
  status: string;
};

type RecoveryCodesAnswer = {
  recoveryCodes: string[];
};

export type NewAccount = {
  inviteCode: string;
  name: string;
  email: string;
  password: string;
};

const reportOnly = { unauthorizedHandling: UnauthorizedHandling.Report };

const backendAuthSource = {
  signUp: (newAccount: NewAccount) =>
    apiClient.post<StatusAnswer>('/auth/sign-up', newAccount, reportOnly),
  verifyEmail: (linkToken: string) =>
    apiClient.post<NextStepAnswer>('/auth/verify-email', { token: linkToken }, reportOnly),
  resendVerificationEmail: (email: string) =>
    apiClient.post<StatusAnswer>('/auth/verify-email/resend', { email }, reportOnly),
  findAuthenticatorSetup: () => apiClient.get<AuthenticatorSetup>('/auth/mfa/setup', reportOnly),
  confirmAuthenticatorSetup: (code: string) =>
    apiClient.post<RecoveryCodesAnswer>('/auth/mfa/setup/confirm', { code }, reportOnly),
  signIn: (email: string, password: string) =>
    apiClient.post<NextStepAnswer>('/auth/sign-in', { email, password }, reportOnly),
  verifySignInCode: (code: string, rememberDevice: boolean) =>
    apiClient.post<SignedInAnswer>('/auth/mfa/verify', { code, rememberDevice }, reportOnly),
  requestPasswordReset: (email: string) =>
    apiClient.post<StatusAnswer>('/auth/password-reset', { email }, reportOnly),
  completePasswordReset: (linkToken: string, password: string) =>
    apiClient.post<NextStepAnswer>(
      '/auth/password-reset/complete',
      { token: linkToken, password },
      reportOnly,
    ),
  confirmEmailChange: (linkToken: string) =>
    apiClient.post<StatusAnswer>('/account/email/confirm', { token: linkToken }, reportOnly),
  signOut: () => apiClient.post<StatusAnswer>('/auth/sign-out'),
  signOutEverywhere: () => apiClient.post<StatusAnswer>('/auth/sign-out-everywhere'),
};

export default backendAuthSource;
