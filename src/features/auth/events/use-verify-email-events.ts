import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import AppError from '@/core/app-error';
import reportAppError from '@/core/report-app-error';
import findPendingEmail from '@/features/auth/actions/find-pending-email';
import resendVerificationEmail from '@/features/auth/actions/resend-verification-email';
import verifyEmail from '@/features/auth/actions/verify-email';
import nextStepPath from '@/features/auth/entities/next-step';
import { APP_HOME_PATH } from '@/features/auth/entities/return-path';
import type useVerifyEmailStates from '@/features/auth/states/use-verify-email-states';

const useVerifyEmailEvents = (states: ReturnType<typeof useVerifyEmailStates>) => {
  const { pendingEmail, setLinkStatus, setLinkError, setPendingEmail, setIsResending } = states;
  const router = useRouter();
  const hasSubmittedLinkRef = useRef(false);

  const handleOpenPage = useCallback(async () => {
    const linkToken = new URLSearchParams(window.location.search).get('token');
    if (linkToken === null) {
      setPendingEmail(findPendingEmail());
      return;
    }
    if (hasSubmittedLinkRef.current) return;
    hasSubmittedLinkRef.current = true;
    setLinkStatus('verifying');
    try {
      const nextStep = await verifyEmail({ linkToken });
      router.replace(nextStepPath(nextStep, APP_HOME_PATH));
    } catch (verifyError) {
      if (!(verifyError instanceof AppError)) throw verifyError;
      setLinkError(verifyError);
      setLinkStatus('failed');
    }
  }, [router, setLinkStatus, setLinkError, setPendingEmail]);

  const handleResendLink = useCallback(async () => {
    if (pendingEmail === null) return;
    setIsResending(true);
    try {
      await resendVerificationEmail({ email: pendingEmail });
      toast.success('Link sent', { description: `Check ${pendingEmail} in a minute or two.` });
    } catch (resendError) {
      reportAppError(resendError);
    } finally {
      setIsResending(false);
    }
  }, [pendingEmail, setIsResending]);

  return { handleOpenPage, handleResendLink };
};

export default useVerifyEmailEvents;
