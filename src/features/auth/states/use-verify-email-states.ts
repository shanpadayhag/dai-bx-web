import { useState } from 'react';
import type AppError from '@/core/app-error';

export type LinkStatus = 'waiting_for_link' | 'verifying' | 'failed';

const useVerifyEmailStates = () => {
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('waiting_for_link');
  const [linkError, setLinkError] = useState<AppError | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  return {
    linkStatus,
    setLinkStatus,
    linkError,
    setLinkError,
    pendingEmail,
    setPendingEmail,
    isResending,
    setIsResending,
  };
};

export default useVerifyEmailStates;
