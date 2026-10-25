import { useState } from 'react';

const useSignUpStates = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return { isSubmitting, setIsSubmitting };
};

export default useSignUpStates;
