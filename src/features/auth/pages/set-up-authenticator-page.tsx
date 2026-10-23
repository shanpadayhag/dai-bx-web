import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import CodeInput from '@/core/components/molecules/code-input';
import Field from '@/core/components/molecules/field';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';
import AuthenticatorQr from '@/features/auth/components/authenticator-qr';
import ManualKey from '@/features/auth/components/manual-key';
import sampleAuthenticatorSetupSource from '@/features/auth/data_sources/sample/authenticator-setup-source';

const SetUpAuthenticatorPage = () => {
  const authenticatorSetup = sampleAuthenticatorSetupSource.find();

  return (
    <AuthFrame
      icon={
        <AuthIcon tone="success">
          <ShieldCheck />
        </AuthIcon>
      }
      title="Add an authenticator"
      description="Every sign-in asks for a 6-digit code from an authenticator app, so a leaked password alone can’t open your account."
      footer={
        <>
          Need an app? Any TOTP app works, like 1Password, Bitwarden, Google Authenticator or{' '}
          <Link href="https://ente.io/auth" className="font-medium text-primary hover:underline">
            Ente Auth
          </Link>
          .
        </>
      }
    >
      <form className="grid gap-6">
        <div className="grid gap-3">
          <p className="text-[13px] font-medium text-foreground">Scan this with the app</p>
          <AuthenticatorQr otpauthUri={authenticatorSetup.otpauthUri} />
          <details className="group grid gap-2 text-[13px]">
            <summary className="w-fit text-muted-foreground hover:text-foreground">
              Can’t scan? Enter the key instead
            </summary>
            <div className="mt-2 grid gap-1.5">
              <ManualKey secretKey={authenticatorSetup.manualKey} />
              <p className="text-xs text-muted-foreground">
                Account {authenticatorSetup.accountEmail}, time-based, 6 digits.
              </p>
            </div>
          </details>
        </div>
        <Field
          label="Code from the app"
          htmlFor="set-up-code"
          hint="It changes every 30 seconds. Enter the one showing now."
        >
          <CodeInput id="set-up-code" name="code" />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Turn on and continue
        </Button>
      </form>
    </AuthFrame>
  );
};

export default SetUpAuthenticatorPage;
