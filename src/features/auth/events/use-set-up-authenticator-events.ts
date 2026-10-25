import { useRouter } from 'next/navigation';
import { useCallback, type FormEvent } from 'react';
import AppError from '@/core/app-error';
import readFormText from '@/core/form-text';
import reportAppError from '@/core/report-app-error';
import confirmAuthenticatorSetup from '@/features/auth/actions/confirm-authenticator-setup';
import findAuthenticatorSetup from '@/features/auth/actions/find-authenticator-setup';
import type useSetUpAuthenticatorStates from '@/features/auth/states/use-set-up-authenticator-states';

const useSetUpAuthenticatorEvents = (states: ReturnType<typeof useSetUpAuthenticatorStates>) => {
  const { setAuthenticatorSetup, setSetupError, setIsSubmitting } = states;
  const router = useRouter();

  const handleLoadSetup = useCallback(async () => {
    try {
      setAuthenticatorSetup(await findAuthenticatorSetup());
    } catch (setupLoadError) {
      if (!(setupLoadError instanceof AppError)) throw setupLoadError;
      setSetupError(setupLoadError);
    }
  }, [setAuthenticatorSetup, setSetupError]);

  const handleSubmitCode = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const codeForm = new FormData(submitEvent.currentTarget);
      setIsSubmitting(true);
      try {
        await confirmAuthenticatorSetup({ code: readFormText(codeForm, 'code') });
        router.push('/recovery-codes');
      } catch (confirmError) {
        reportAppError(confirmError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setIsSubmitting],
  );

  return { handleLoadSetup, handleSubmitCode };
};

export default useSetUpAuthenticatorEvents;
