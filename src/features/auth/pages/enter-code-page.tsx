import { KeyRound } from 'lucide-react';
import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Checkbox from '@/core/components/atoms/checkbox';
import Input from '@/core/components/atoms/input';
import CodeInput from '@/core/components/molecules/code-input';
import Field from '@/core/components/molecules/field';
import AuthFrame from '@/features/auth/components/auth-frame';
import AuthIcon from '@/features/auth/components/auth-icon';

const EnterCodePage = () => (
  <AuthFrame
    icon={
      <AuthIcon>
        <KeyRound />
      </AuthIcon>
    }
    title="Enter your code"
    description="Open your authenticator app and type the 6-digit code for DaiBX."
    footer={
      <>
        Not you?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Start over
        </Link>
      </>
    }
  >
    <form className="grid gap-5">
      <Field label="Authenticator code" htmlFor="enter-code">
        <CodeInput id="enter-code" name="code" autoFocus />
      </Field>
      <Checkbox
        id="remember-device"
        name="rememberDevice"
        label="Remember this device for 30 days"
      />
      <Button type="submit" size="lg" className="w-full">
        Verify
      </Button>
      <details className="grid gap-3 border-t border-border pt-5 text-[13px]">
        <summary className="w-fit text-muted-foreground hover:text-foreground">
          Lost your phone? Use a recovery code
        </summary>
        <div className="mt-3 grid gap-3">
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
          <Button type="submit" variant="secondary" className="w-full">
            Use recovery code
          </Button>
        </div>
      </details>
    </form>
  </AuthFrame>
);

export default EnterCodePage;
