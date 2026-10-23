import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import AuthFrame from '@/features/auth/components/auth-frame';

const ForgotPasswordPage = () => (
  <AuthFrame
    title="Reset your password"
    description="Enter the email you sign in with. If it has an account, we’ll send a link to choose a new password."
    footer={
      <>
        Remembered it?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </>
    }
  >
    <form className="grid gap-4">
      <Field label="Email" htmlFor="forgot-password-email">
        <Input
          id="forgot-password-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </Field>
      <Button type="submit" size="lg" className="mt-2 w-full">
        Send reset link
      </Button>
      <p className="text-xs text-muted-foreground">
        The link works once and expires in 30 minutes. You’ll still need your authenticator to sign
        in afterwards.
      </p>
    </form>
  </AuthFrame>
);

export default ForgotPasswordPage;
