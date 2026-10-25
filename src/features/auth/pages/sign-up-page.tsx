'use client';

import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import AuthFrame from '@/features/auth/components/auth-frame';
import SignedInRedirect from '@/features/auth/components/signed-in-redirect';
import useSignUpEvents from '@/features/auth/events/use-sign-up-events';
import useSignUpStates from '@/features/auth/states/use-sign-up-states';

const SignUpPage = () => {
  const states = useSignUpStates();
  const events = useSignUpEvents(states);

  return (
    <>
      <SignedInRedirect />
      <AuthFrame
        title="Create your workspace"
        description="DaiBX is invite-only for now. Tasks, a board and a calendar, set up in under a minute."
        footer={
          <>
            Already have an account?{' '}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={(submitEvent) => void events.handleSubmitSignUp(submitEvent)}
        >
          <Field
            label="Invite code"
            htmlFor="sign-up-invite"
            hint="From the email or message that invited you."
          >
            <Input
              id="sign-up-invite"
              name="inviteCode"
              autoComplete="off"
              spellCheck={false}
              className="font-mono tracking-wide"
            />
          </Field>
          <Field label="Name" htmlFor="sign-up-name">
            <Input
              id="sign-up-name"
              name="name"
              autoComplete="name"
              placeholder="What should we call you?"
            />
          </Field>
          <Field label="Email" htmlFor="sign-up-email">
            <Input
              id="sign-up-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field
            label="Password"
            htmlFor="sign-up-password"
            hint="15 to 128 characters. A few unrelated words make a strong one."
          >
            <PasswordInput id="sign-up-password" name="password" autoComplete="new-password" />
          </Field>
          <Button type="submit" size="lg" className="mt-2 w-full" disabled={states.isSubmitting}>
            {states.isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
          <p className="text-xs text-muted-foreground">
            By creating an account you agree to the terms and privacy policy.
          </p>
        </form>
      </AuthFrame>
    </>
  );
};

export default SignUpPage;
