'use client';

import { LoaderCircle, MailCheck, MailX } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import Button from '@/core/components/atoms/button';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import useVerifyEmailEvents from '@/features/auth/events/use-verify-email-events';
import useVerifyEmailStates from '@/features/auth/states/use-verify-email-states';

const signInFooter = (
  <>
    Need a new link?{' '}
    <Link href="/sign-in" className="font-medium text-primary hover:underline">
      Sign in
    </Link>{' '}
    and we’ll offer one.
  </>
);

const VerifyEmailPage = () => {
  const states = useVerifyEmailStates();
  const events = useVerifyEmailEvents(states);
  const { handleOpenPage } = events;

  useEffect(() => {
    void handleOpenPage();
  }, [handleOpenPage]);

  if (states.linkStatus === 'verifying') {
    return (
      <AuthFrame
        icon={
          <AuthIcon>
            <MailCheck />
          </AuthIcon>
        }
        title="Confirming your email"
        description="This takes a moment."
        footer={signInFooter}
      >
        <div role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
          Checking the link…
        </div>
      </AuthFrame>
    );
  }

  if (states.linkStatus === 'failed') {
    return (
      <AuthFrame
        icon={
          <AuthIcon tone="warning">
            <MailX />
          </AuthIcon>
        }
        title="This link didn’t work"
        description={states.linkError?.description}
        footer={signInFooter}
      >
        <Button href="/sign-in" variant="secondary" size="lg" className="w-full">
          Go to sign in
        </Button>
      </AuthFrame>
    );
  }

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
          We sent a link to{' '}
          {states.pendingEmail === null ? (
            'the address you signed up with'
          ) : (
            <span className="font-medium text-foreground">{states.pendingEmail}</span>
          )}
          . Open it on any device to confirm the address. It works once and expires in 24 hours.
        </>
      }
      footer={
        <>
          Wrong address?{' '}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Sign up again
          </Link>
        </>
      }
    >
      <div className="grid gap-3">
        {states.pendingEmail === null ? null : (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={states.isResending}
            onClick={() => void events.handleResendLink()}
          >
            Send the link again
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Nothing after a few minutes? Check spam, or send it again. You can ask for a new link a
          few times an hour.
        </p>
      </div>
    </AuthFrame>
  );
};

export default VerifyEmailPage;
