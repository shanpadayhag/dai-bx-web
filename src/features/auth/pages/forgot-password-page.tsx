'use client';

import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import useForgotPasswordEvents from '@/features/auth/events/use-forgot-password-events';
import useForgotPasswordStates from '@/features/auth/states/use-forgot-password-states';

const backToSignInFooter = (
  <>
    Remembered it?{' '}
    <Link href="/sign-in" className="font-medium text-primary hover:underline">
      Back to sign in
    </Link>
  </>
);

const ForgotPasswordPage = () => {
  const states = useForgotPasswordStates();
  const events = useForgotPasswordEvents(states);

  if (states.resetEmail !== null) {
    return (
      <AuthFrame
        icon={
          <AuthIcon>
            <MailCheck />
          </AuthIcon>
        }
        title="Check your email"
        description={
          <>
            If <span className="font-medium text-foreground">{states.resetEmail}</span> has a DaiBX
            account, a link to choose a new password is on its way. It works once and expires in 30
            minutes.
          </>
        }
        footer={backToSignInFooter}
      >
        <p className="text-xs text-muted-foreground">
          Nothing after a few minutes? Check spam, or ask again. You can ask a few times an hour.
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Reset your password"
      description="Enter the email you sign in with. If it has an account, we’ll send a link to choose a new password."
      footer={backToSignInFooter}
    >
      <form
        className="grid gap-4"
        onSubmit={(submitEvent) => void events.handleSubmitResetRequest(submitEvent)}
      >
        <Field label="Email" htmlFor="forgot-password-email">
          <Input
            id="forgot-password-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={states.isSubmitting}>
          Send reset link
        </Button>
        <p className="text-xs text-muted-foreground">
          The link works once and expires in 30 minutes. You’ll still need your authenticator to
          sign in afterwards.
        </p>
      </form>
    </AuthFrame>
  );
};

export default ForgotPasswordPage;
