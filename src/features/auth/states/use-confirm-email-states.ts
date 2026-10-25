import { useState } from 'react';
import type AppError from '@/core/app-error';

export type ConfirmEmailStatus = 'confirming' | 'confirmed' | 'failed' | 'missing_token';

const useConfirmEmailStates = () => {
  const [confirmEmailStatus, setConfirmEmailStatus] = useState<ConfirmEmailStatus>('confirming');
  const [confirmError, setConfirmError] = useState<AppError | null>(null);

  return {
    confirmEmailStatus,
    setConfirmEmailStatus,
    confirmError,
    setConfirmError,
  };
};

export default useConfirmEmailStates;
