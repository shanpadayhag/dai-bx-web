'use client';

import { LoaderCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import Button from '@/core/components/atoms/button';
import CodeInput from '@/core/components/molecules/code-input';
import Field from '@/core/components/molecules/field';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import AuthenticatorQr from '@/core/components/molecules/authenticator-qr';
import ManualKey from '@/core/components/molecules/manual-key';
import { authenticatorAccountEmail } from '@/features/auth/entities/authenticator-setup';
import useSetUpAuthenticatorEvents from '@/features/auth/events/use-set-up-authenticator-events';
import useSetUpAuthenticatorStates from '@/features/auth/states/use-set-up-authenticator-states';

const appSuggestionFooter = (
  <>
    Need an app? Any TOTP app works, like 1Password, Bitwarden, Google Authenticator or{' '}
    <Link href="https://ente.io/auth" className="font-medium text-primary hover:underline">
      Ente Auth
    </Link>
    .
  </>
);

const SetUpAuthenticatorPage = () => {
  const states = useSetUpAuthenticatorStates();
  const events = useSetUpAuthenticatorEvents(states);
  const { handleLoadSetup } = events;

  useEffect(() => {
    void handleLoadSetup();
  }, [handleLoadSetup]);

  if (states.setupError !== null) {
    return (
      <AuthFrame
        icon={
          <AuthIcon tone="warning">
            <ShieldAlert />
          </AuthIcon>
        }
        title={states.setupError.title}
        description={states.setupError.description}
        footer={appSuggestionFooter}
      >
        <Button href="/sign-in" size="lg" className="w-full">
          Sign in again
        </Button>
      </AuthFrame>
    );
  }

  const authenticatorSetup = states.authenticatorSetup;
  const accountEmail =
    authenticatorSetup === null ? null : authenticatorAccountEmail(authenticatorSetup);

  return (
    <AuthFrame
      icon={
        <AuthIcon tone="success">
          <ShieldCheck />
        </AuthIcon>
      }
      title="Add an authenticator"
      description="Every sign-in asks for a 6-digit code from an authenticator app, so a leaked password alone can’t open your account."
      footer={appSuggestionFooter}
    >
      <form
        className="grid gap-6"
        onSubmit={(submitEvent) => void events.handleSubmitCode(submitEvent)}
      >
        <div className="grid gap-3">
          <p className="text-[13px] font-medium text-foreground">Scan this with the app</p>
          {authenticatorSetup === null ? (
            <div
              role="status"
              className="inline-flex size-[196px] items-center justify-center rounded-2xl border border-border bg-surface text-muted-foreground"
            >
              <LoaderCircle
                aria-label="Preparing your key"
                className="size-5 motion-safe:animate-spin"
              />
            </div>
          ) : (
            <>
              <AuthenticatorQr otpauthUri={authenticatorSetup.otpauthUri} />
              <details className="group grid gap-2 text-[13px]">
                <summary className="w-fit text-muted-foreground hover:text-foreground">
                  Can’t scan? Enter the key instead
                </summary>
                <div className="mt-2 grid gap-1.5">
                  <ManualKey secretKey={authenticatorSetup.manualEntryKey.replaceAll(' ', '')} />
                  <p className="text-xs text-muted-foreground">
                    {accountEmail === null ? 'Your DaiBX account' : `Account ${accountEmail}`},
                    time-based, 6 digits.
                  </p>
                </div>
              </details>
            </>
          )}
        </div>
        <Field
          label="Code from the app"
          htmlFor="set-up-code"
          hint="It changes every 30 seconds. Enter the one showing now."
        >
          <CodeInput id="set-up-code" name="code" />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={authenticatorSetup === null || states.isSubmitting}
        >
          Turn on and continue
        </Button>
      </form>
    </AuthFrame>
  );
};

export default SetUpAuthenticatorPage;
