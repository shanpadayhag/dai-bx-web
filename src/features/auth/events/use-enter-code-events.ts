import { useRouter } from 'next/navigation';
import { useCallback, type FormEvent } from 'react';
import readFormText from '@/core/form-text';
import reportAppError from '@/core/report-app-error';
import verifySignInCode from '@/features/auth/actions/verify-sign-in-code';
import { readRequestedReturnPath } from '@/features/auth/entities/return-path';
import type useEnterCodeStates from '@/features/auth/states/use-enter-code-states';

const useEnterCodeEvents = (states: ReturnType<typeof useEnterCodeStates>) => {
  const {
    isRememberingDevice,
    setIsRememberingDevice,
    setIsSubmitting,
    setRemainingRecoveryCodeCount,
  } = states;
  const router = useRouter();

  const handleContinue = useCallback(() => {
    router.replace(readRequestedReturnPath(window.location.search));
  }, [router]);

  const submitCode = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>, codeFieldName: string) => {
      submitEvent.preventDefault();
      const codeForm = new FormData(submitEvent.currentTarget);
      setIsSubmitting(true);
      try {
        const remainingRecoveryCodes = await verifySignInCode({
          code: readFormText(codeForm, codeFieldName),
          rememberDevice: isRememberingDevice,
        });
        if (remainingRecoveryCodes === null) {
          handleContinue();
          return;
        }
        setRemainingRecoveryCodeCount(remainingRecoveryCodes);
      } catch (verifyError) {
        reportAppError(verifyError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleContinue, isRememberingDevice, setIsSubmitting, setRemainingRecoveryCodeCount],
  );

  const handleSubmitAuthenticatorCode = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) => submitCode(submitEvent, 'code'),
    [submitCode],
  );

  const handleSubmitRecoveryCode = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) => submitCode(submitEvent, 'recoveryCode'),
    [submitCode],
  );

  const handleChangeRememberDevice = useCallback(
    (isChecked: boolean) => setIsRememberingDevice(isChecked),
    [setIsRememberingDevice],
  );

  return {
    handleSubmitAuthenticatorCode,
    handleSubmitRecoveryCode,
    handleChangeRememberDevice,
    handleContinue,
  };
};

export default useEnterCodeEvents;
