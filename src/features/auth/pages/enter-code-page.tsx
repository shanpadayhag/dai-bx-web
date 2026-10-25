'use client';

import { KeyRound, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Checkbox from '@/core/components/atoms/checkbox';
import Input from '@/core/components/atoms/input';
import CodeInput from '@/core/components/molecules/code-input';
import Field from '@/core/components/molecules/field';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import useEnterCodeEvents from '@/features/auth/events/use-enter-code-events';
import useEnterCodeStates from '@/features/auth/states/use-enter-code-states';

const startOverFooter = (
  <>
    Not you?{' '}
    <Link href="/sign-in" className="font-medium text-primary hover:underline">
      Start over
    </Link>
  </>
);

const EnterCodePage = () => {
  const states = useEnterCodeStates();
  const events = useEnterCodeEvents(states);

  if (states.remainingRecoveryCodeCount !== null) {
    return (
      <AuthFrame
        icon={
          <AuthIcon tone="warning">
            <LifeBuoy />
          </AuthIcon>
        }
        title="You’re in"
        description={`That recovery code is used up. You have ${states.remainingRecoveryCodeCount} recovery codes left. If your phone is gone for good, replace the authenticator and make new codes in Settings.`}
        footer="Each recovery code works once."
      >
        <Button size="lg" className="w-full" onClick={events.handleContinue}>
          Continue to DaiBX
        </Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      icon={
        <AuthIcon>
          <KeyRound />
        </AuthIcon>
      }
      title="Enter your code"
      description="Open your authenticator app and type the 6-digit code for DaiBX."
      footer={startOverFooter}
    >
      <div className="grid gap-5">
        <form
          className="grid gap-5"
          onSubmit={(submitEvent) => void events.handleSubmitAuthenticatorCode(submitEvent)}
        >
          <Field label="Authenticator code" htmlFor="enter-code">
            <CodeInput id="enter-code" name="code" autoFocus />
          </Field>
          <Checkbox
            id="remember-device"
            name="rememberDevice"
            label="Remember this device for 30 days"
            checked={states.isRememberingDevice}
            onChange={(changeEvent) =>
              events.handleChangeRememberDevice(changeEvent.target.checked)
            }
          />
          <Button type="submit" size="lg" className="w-full" disabled={states.isSubmitting}>
            Verify
          </Button>
        </form>
        <details className="grid gap-3 border-t border-border pt-5 text-[13px]">
          <summary className="w-fit text-muted-foreground hover:text-foreground">
            Lost your phone? Use a recovery code
          </summary>
          <form
            className="mt-3 grid gap-3"
            onSubmit={(submitEvent) => void events.handleSubmitRecoveryCode(submitEvent)}
          >
            <Field
              label="Recovery code"
              htmlFor="recovery-code"
              hint="One of the 10 codes you saved. Each works once."
            >
              <Input
                id="recovery-code"
                name="recoveryCode"
                autoComplete="off"
                spellCheck={false}
                placeholder="XXXX-XXXX-XXXX"
                className="font-mono tracking-wide uppercase"
              />
            </Field>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={states.isSubmitting}
            >
              Use recovery code
            </Button>
          </form>
        </details>
      </div>
    </AuthFrame>
  );
};

export default EnterCodePage;
