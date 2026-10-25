import { useState } from 'react';

export type ResetLinkStatus = 'reading' | 'ready' | 'missing_token';

const useResetPasswordStates = () => {
  const [resetLinkStatus, setResetLinkStatus] = useState<ResetLinkStatus>('reading');
  const [linkToken, setLinkToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return {
    resetLinkStatus,
    setResetLinkStatus,
    linkToken,
    setLinkToken,
    isSubmitting,
    setIsSubmitting,
  };
};

export default useResetPasswordStates;
