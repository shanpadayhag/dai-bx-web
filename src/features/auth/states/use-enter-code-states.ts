import { useState } from 'react';

const useEnterCodeStates = () => {
  const [isRememberingDevice, setIsRememberingDevice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingRecoveryCodeCount, setRemainingRecoveryCodeCount] = useState<number | null>(null);

  return {
    isRememberingDevice,
    setIsRememberingDevice,
    isSubmitting,
    setIsSubmitting,
    remainingRecoveryCodeCount,
    setRemainingRecoveryCodeCount,
  };
};

export default useEnterCodeStates;
