import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import UnauthorizedHandling from '@/core/api/unauthorized-handling';
import AppError from '@/core/app-error';
import findSignedInUser from '@/features/auth/actions/find-signed-in-user';
import parseReturnPath from '@/features/auth/entities/return-path';

const useSignedInRedirectEvents = () => {
  const router = useRouter();

  const handleRedirectSignedInVisitor = useCallback(async () => {
    try {
      const signedInUser = await findSignedInUser({
        unauthorizedHandling: UnauthorizedHandling.RenewOrReport,
      });
      if (signedInUser === null) return;
      const requestedNextPath = new URLSearchParams(window.location.search).get('next');
      router.replace(parseReturnPath(requestedNextPath));
    } catch (sessionError) {
      if (!(sessionError instanceof AppError)) throw sessionError;
    }
  }, [router]);

  return { handleRedirectSignedInVisitor };
};

export default useSignedInRedirectEvents;
