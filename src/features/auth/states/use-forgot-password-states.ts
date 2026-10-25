import { useState } from 'react';

const useForgotPasswordStates = () => {
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return {
    resetEmail,
    setResetEmail,
    isSubmitting,
    setIsSubmitting,
  };
};

export default useForgotPasswordStates;
