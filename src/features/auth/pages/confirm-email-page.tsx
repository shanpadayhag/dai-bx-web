'use client';

import { Link2Off, LoaderCircle, MailCheck, MailX } from 'lucide-react';
import { useEffect } from 'react';
import Button from '@/core/components/atoms/button';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import useConfirmEmailEvents from '@/features/auth/events/use-confirm-email-events';
import useConfirmEmailStates from '@/features/auth/states/use-confirm-email-states';

const settingsFooter = 'You can change your email again any time in Settings.';

const ConfirmEmailPage = () => {
  const states = useConfirmEmailStates();
  const events = useConfirmEmailEvents(states);
  const { handleOpenLink } = events;

  useEffect(() => {
    void handleOpenLink();
  }, [handleOpenLink]);

  if (states.confirmEmailStatus === 'confirmed') {
    return (
      <AuthFrame
        icon={
          <AuthIcon tone="success">
            <MailCheck />
          </AuthIcon>
        }
        title="Email changed"
        description="Sign-in, links and resets now use the new address. Your password and authenticator haven’t changed."
        footer={settingsFooter}
      >
        <Button href="/settings" size="lg" className="w-full">
          Back to DaiBX
        </Button>
      </AuthFrame>
    );
  }

  if (states.confirmEmailStatus === 'failed') {
    return (
      <AuthFrame
        icon={
          <AuthIcon tone="warning">
            <MailX />
          </AuthIcon>
        }
        title="This link didn’t work"
        description={states.confirmError?.description}
        footer={settingsFooter}
      >
        <Button href="/settings" variant="secondary" size="lg" className="w-full">
          Go to Settings
        </Button>
      </AuthFrame>
    );
  }

  if (states.confirmEmailStatus === 'missing_token') {
    return (
      <AuthFrame
        icon={
          <AuthIcon tone="warning">
            <Link2Off />
          </AuthIcon>
        }
        title="This link is incomplete"
        description="Open the whole link from the email, or ask for a new one in Settings."
        footer={settingsFooter}
      >
        <Button href="/settings" variant="secondary" size="lg" className="w-full">
          Go to Settings
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
      title="Confirming your new email"
      description="This takes a moment."
      footer={settingsFooter}
    >
      <div role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
        Checking the link…
      </div>
    </AuthFrame>
  );
};

export default ConfirmEmailPage;
