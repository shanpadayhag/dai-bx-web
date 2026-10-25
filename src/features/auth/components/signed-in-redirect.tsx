'use client';

import { useEffect } from 'react';
import useSignedInRedirectEvents from '@/features/auth/events/use-signed-in-redirect-events';

const SignedInRedirect = () => {
  const { handleRedirectSignedInVisitor } = useSignedInRedirectEvents();

  useEffect(() => {
    void handleRedirectSignedInVisitor();
  }, [handleRedirectSignedInVisitor]);

  return null;
};

export default SignedInRedirect;
