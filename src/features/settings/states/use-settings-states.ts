import { useState } from 'react';
import type AppError from '@/core/app-error';
import type { AuthenticatorSetup } from '@/features/auth/entities/authenticator-setup';
import type { Account } from '@/features/settings/entities/account';

const useSettingsStates = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [accountLoadError, setAccountLoadError] = useState<AppError | null>(null);
  const [submittingDialogId, setSubmittingDialogId] = useState<string | null>(null);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<readonly string[] | null>(null);
  const [replacementSetup, setReplacementSetup] = useState<AuthenticatorSetup | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  return {
    account,
    setAccount,
    accountLoadError,
    setAccountLoadError,
    submittingDialogId,
    setSubmittingDialogId,
    newRecoveryCodes,
    setNewRecoveryCodes,
    replacementSetup,
    setReplacementSetup,
    isSigningOut,
    setIsSigningOut,
  };
};

export default useSettingsStates;
