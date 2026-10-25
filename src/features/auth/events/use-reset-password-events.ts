import { useRouter } from 'next/navigation';
import { useCallback, type FormEvent } from 'react';
import readFormText from '@/core/form-text';
import reportAppError from '@/core/report-app-error';
import completePasswordReset from '@/features/auth/actions/complete-password-reset';
import nextStepPath from '@/features/auth/entities/next-step';
import { APP_HOME_PATH } from '@/features/auth/entities/return-path';
import type useResetPasswordStates from '@/features/auth/states/use-reset-password-states';

const useResetPasswordEvents = (states: ReturnType<typeof useResetPasswordStates>) => {
  const { linkToken, setResetLinkStatus, setLinkToken, setIsSubmitting } = states;
  const router = useRouter();

  const handleReadLink = useCallback(() => {
    const presentedLinkToken = new URLSearchParams(window.location.search).get('token');
    if (presentedLinkToken === null || presentedLinkToken.trim() === '') {
      setResetLinkStatus('missing_token');
      return;
    }
    setLinkToken(presentedLinkToken);
    setResetLinkStatus('ready');
  }, [setResetLinkStatus, setLinkToken]);

  const handleSubmitNewPassword = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const resetForm = new FormData(submitEvent.currentTarget);
      setIsSubmitting(true);
      try {
        const nextStep = await completePasswordReset({
          linkToken,
          password: readFormText(resetForm, 'password'),
        });
        router.push(nextStepPath(nextStep, APP_HOME_PATH));
      } catch (resetError) {
        reportAppError(resetError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [linkToken, router, setIsSubmitting],
  );

  return { handleReadLink, handleSubmitNewPassword };
};

export default useResetPasswordEvents;
