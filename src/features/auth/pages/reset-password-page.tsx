'use client';

import { Link2Off } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import Button from '@/core/components/atoms/button';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import useResetPasswordEvents from '@/features/auth/events/use-reset-password-events';
import useResetPasswordStates from '@/features/auth/states/use-reset-password-states';

const backToSignInFooter = (
  <>
    Didn’t ask for this?{' '}
    <Link href="/sign-in" className="font-medium text-primary hover:underline">
      Back to sign in
    </Link>
  </>
);

const ResetPasswordPage = () => {
  const states = useResetPasswordStates();
  const events = useResetPasswordEvents(states);
  const { handleReadLink } = events;

  useEffect(() => {
    handleReadLink();
  }, [handleReadLink]);

  if (states.resetLinkStatus === 'missing_token') {
    return (
      <AuthFrame
        icon={
          <AuthIcon tone="warning">
            <Link2Off />
          </AuthIcon>
        }
        title="This link is incomplete"
        description="Open the whole link from the email, or ask for a new one."
        footer={backToSignInFooter}
      >
        <Button href="/forgot-password" size="lg" className="w-full">
          Ask for a new link
        </Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Choose a new password"
      description="Saving it signs you out on every device and forgets remembered ones. Then you’ll sign in with the new password and your authenticator."
      footer={backToSignInFooter}
    >
      <form
        className="grid gap-4"
        onSubmit={(submitEvent) => void events.handleSubmitNewPassword(submitEvent)}
      >
        <Field
          label="New password"
          htmlFor="reset-password"
          hint="15 to 128 characters. A few unrelated words make a strong one."
        >
          <PasswordInput id="reset-password" name="password" autoComplete="new-password" />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={states.resetLinkStatus !== 'ready' || states.isSubmitting}
        >
          Save new password
        </Button>
      </form>
    </AuthFrame>
  );
};

export default ResetPasswordPage;
