import { useRouter } from 'next/navigation';
import { useCallback, type FormEvent } from 'react';
import readFormText from '@/core/form-text';
import reportAppError from '@/core/report-app-error';
import signUp from '@/features/auth/actions/sign-up';
import type useSignUpStates from '@/features/auth/states/use-sign-up-states';

const useSignUpEvents = (states: ReturnType<typeof useSignUpStates>) => {
  const { setIsSubmitting } = states;
  const router = useRouter();

  const handleSubmitSignUp = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const signUpForm = new FormData(submitEvent.currentTarget);
      setIsSubmitting(true);
      try {
        await signUp({
          inviteCode: readFormText(signUpForm, 'inviteCode'),
          name: readFormText(signUpForm, 'name'),
          email: readFormText(signUpForm, 'email'),
          password: readFormText(signUpForm, 'password'),
        });
        router.push('/verify-email');
      } catch (signUpError) {
        reportAppError(signUpError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setIsSubmitting],
  );

  return { handleSubmitSignUp };
};

export default useSignUpEvents;
