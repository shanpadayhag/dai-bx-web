import apiClient from '@/core/api/api-client';
import type {
  Account,
  AccountProfile,
  IdentityProof,
  ProfileChanges,
} from '@/features/settings/entities/account';

type StatusAnswer = {
  status: string;
};

type RecoveryCodesAnswer = {
  recoveryCodes: string[];
};

const backendAccountSource = {
  find: () => apiClient.get<Account>('/account'),
  updateProfile: (profileChanges: ProfileChanges) =>
    apiClient.patch<AccountProfile>('/account', profileChanges),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<StatusAnswer>('/account/password', { currentPassword, newPassword }),
  requestEmailChange: (identityProof: IdentityProof, newEmail: string) =>
    apiClient.post<StatusAnswer>('/account/email', { ...identityProof, newEmail }),
  regenerateRecoveryCodes: (identityProof: IdentityProof) =>
    apiClient.post<RecoveryCodesAnswer>('/account/recovery-codes', identityProof),
  startAuthenticatorReplacement: (identityProof: IdentityProof) =>
    apiClient.post<StatusAnswer>('/account/authenticator', identityProof),
  confirmAuthenticatorReplacement: (code: string) =>
    apiClient.post<StatusAnswer>('/account/authenticator/confirm', { code }),
  delete: (identityProof: IdentityProof, confirmation: string) =>
    apiClient.post<StatusAnswer>('/account/delete', { ...identityProof, confirmation }),
};

export default backendAccountSource;
