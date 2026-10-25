import { useState } from 'react';
import type AppError from '@/core/app-error';
import type SignedInUser from '@/features/auth/entities/signed-in-user';

export type SessionCheckStatus = 'checking' | 'signed_in' | 'failed';

const useSessionGateStates = () => {
  const [sessionCheckStatus, setSessionCheckStatus] = useState<SessionCheckStatus>('checking');
  const [sessionCheckError, setSessionCheckError] = useState<AppError | null>(null);
  const [signedInUser, setSignedInUser] = useState<SignedInUser | null>(null);

  return {
    sessionCheckStatus,
    setSessionCheckStatus,
    sessionCheckError,
    setSessionCheckError,
    signedInUser,
    setSignedInUser,
  };
};

export default useSessionGateStates;
