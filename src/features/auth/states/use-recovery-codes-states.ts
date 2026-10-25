import { useState } from 'react';

export type RecoveryCodesStatus = 'loading' | 'showing' | 'already_shown';

const useRecoveryCodesStates = () => {
  const [recoveryCodesStatus, setRecoveryCodesStatus] = useState<RecoveryCodesStatus>('loading');
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[]>([]);
  const [hasSavedCodes, setHasSavedCodes] = useState(false);

  return {
    recoveryCodesStatus,
    setRecoveryCodesStatus,
    recoveryCodes,
    setRecoveryCodes,
    hasSavedCodes,
    setHasSavedCodes,
  };
};

export default useRecoveryCodesStates;
