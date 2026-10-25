import { useRouter } from 'next/navigation';
import { useCallback, type FormEvent } from 'react';
import readFormText from '@/core/form-text';
import reportAppError from '@/core/report-app-error';
import signIn from '@/features/auth/actions/sign-in';
import nextStepPath from '@/features/auth/entities/next-step';
import { readRequestedReturnPath } from '@/features/auth/entities/return-path';
import type useSignInStates from '@/features/auth/states/use-sign-in-states';

const useSignInEvents = (states: ReturnType<typeof useSignInStates>) => {
  const { setIsSubmitting } = states;
  const router = useRouter();

  const handleSubmitSignIn = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const signInForm = new FormData(submitEvent.currentTarget);
      setIsSubmitting(true);
      try {
        const nextStep = await signIn({
          email: readFormText(signInForm, 'email'),
          password: readFormText(signInForm, 'password'),
        });
        const returnPath = readRequestedReturnPath(window.location.search);
        if (nextStep === 'signed_in') {
          router.replace(returnPath);
          return;
        }
        router.push(nextStepPath(nextStep, returnPath));
      } catch (signInError) {
        reportAppError(signInError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setIsSubmitting],
  );

  return { handleSubmitSignIn };
};

export default useSignInEvents;
