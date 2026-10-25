import { useState } from 'react';
import type AppError from '@/core/app-error';
import type { AuthenticatorSetup } from '@/features/auth/entities/authenticator-setup';

const useSetUpAuthenticatorStates = () => {
  const [authenticatorSetup, setAuthenticatorSetup] = useState<AuthenticatorSetup | null>(null);
  const [setupError, setSetupError] = useState<AppError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return {
    authenticatorSetup,
    setAuthenticatorSetup,
    setupError,
    setSetupError,
    isSubmitting,
    setIsSubmitting,
  };
};

export default useSetUpAuthenticatorStates;
