import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { forgetAppearance } from '@/core/appearance';
import reportAppError from '@/core/report-app-error';
import signOut from '@/features/auth/actions/sign-out';
import type useSidebarAccountStates from '@/features/auth/states/use-sidebar-account-states';

const SIGN_IN_PATH = '/sign-in';

const useSidebarAccountEvents = (states: ReturnType<typeof useSidebarAccountStates>) => {
  const { setIsSigningOut } = states;
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      forgetAppearance();
      router.replace(SIGN_IN_PATH);
    } catch (signOutError) {
      setIsSigningOut(false);
      reportAppError(signOutError);
    }
  }, [router, setIsSigningOut]);

  return { handleSignOut };
};

export default useSidebarAccountEvents;
