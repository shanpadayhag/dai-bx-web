import { useCallback, type FormEvent } from 'react';
import readFormText from '@/core/form-text';
import reportAppError from '@/core/report-app-error';
import requestPasswordReset from '@/features/auth/actions/request-password-reset';
import type useForgotPasswordStates from '@/features/auth/states/use-forgot-password-states';

const useForgotPasswordEvents = (states: ReturnType<typeof useForgotPasswordStates>) => {
  const { setResetEmail, setIsSubmitting } = states;

  const handleSubmitResetRequest = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const resetEmail = readFormText(new FormData(submitEvent.currentTarget), 'email').trim();
      setIsSubmitting(true);
      try {
        await requestPasswordReset({ email: resetEmail });
        setResetEmail(resetEmail);
      } catch (resetError) {
        reportAppError(resetError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [setResetEmail, setIsSubmitting],
  );

  return { handleSubmitResetRequest };
};

export default useForgotPasswordEvents;
