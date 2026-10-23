import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import AuthFrame from '@/features/auth/components/auth-frame';

const SignInPage = () => (
  <AuthFrame
    title="Welcome back"
    description="Sign in to pick up where your timer left off."
    footer={
      <>
        New to DaiBX?{' '}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </>
    }
  >
    <form className="grid gap-4">
      <Field label="Email" htmlFor="sign-in-email">
        <Input id="sign-in-email" type="email" autoComplete="email" placeholder="you@example.com" />
      </Field>
      <Field
        label="Password"
        htmlFor="sign-in-password"
        trailing={
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot it?
          </Link>
        }
      >
        <PasswordInput id="sign-in-password" name="password" autoComplete="current-password" />
      </Field>
      <Button type="submit" size="lg" className="mt-2 w-full">
        Sign in
      </Button>
    </form>
  </AuthFrame>
);

export default SignInPage;
