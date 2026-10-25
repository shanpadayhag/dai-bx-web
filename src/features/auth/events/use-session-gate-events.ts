import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { SignedOutError } from '@/core/api/api-error';
import UnauthorizedHandling from '@/core/api/unauthorized-handling';
import AppError from '@/core/app-error';
import { applyAppearance } from '@/core/appearance';
import findSignedInUser from '@/features/auth/actions/find-signed-in-user';
import { buildSignInPath } from '@/features/auth/entities/return-path';
import type useSessionGateStates from '@/features/auth/states/use-session-gate-states';

const useSessionGateEvents = (states: ReturnType<typeof useSessionGateStates>) => {
  const { setSessionCheckStatus, setSessionCheckError } = states;
  const router = useRouter();

  const handleSignedOut = useCallback(() => {
    const requestedPath = `${window.location.pathname}${window.location.search}`;
    router.replace(buildSignInPath(requestedPath));
  }, [router]);

  const handleCheckSession = useCallback(async () => {
    setSessionCheckStatus('checking');
    try {
      const signedInUser = await findSignedInUser({
        unauthorizedHandling: UnauthorizedHandling.RenewOrSignOut,
      });
      if (signedInUser === null) {
        handleSignedOut();
        return;
      }
      applyAppearance(signedInUser);
      setSessionCheckStatus('signed_in');
    } catch (sessionError) {
      if (sessionError instanceof SignedOutError) return;
      if (!(sessionError instanceof AppError)) throw sessionError;
      setSessionCheckError(sessionError);
      setSessionCheckStatus('failed');
    }
  }, [handleSignedOut, setSessionCheckStatus, setSessionCheckError]);

  return { handleCheckSession, handleSignedOut };
};

export default useSessionGateEvents;
