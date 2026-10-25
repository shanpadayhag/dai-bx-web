import { useState } from 'react';

const useSignInStates = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return { isSubmitting, setIsSubmitting };
};

export default useSignInStates;
