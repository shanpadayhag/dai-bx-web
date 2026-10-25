import { useState } from 'react';
import type AppError from '@/core/app-error';

export type SessionCheckStatus = 'checking' | 'signed_in' | 'failed';

const useSessionGateStates = () => {
  const [sessionCheckStatus, setSessionCheckStatus] = useState<SessionCheckStatus>('checking');
  const [sessionCheckError, setSessionCheckError] = useState<AppError | null>(null);

  return {
    sessionCheckStatus,
    setSessionCheckStatus,
    sessionCheckError,
    setSessionCheckError,
  };
};

export default useSessionGateStates;
