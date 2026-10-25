import { useState } from 'react';

const useSidebarAccountStates = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return { isSigningOut, setIsSigningOut };
};

export default useSidebarAccountStates;
