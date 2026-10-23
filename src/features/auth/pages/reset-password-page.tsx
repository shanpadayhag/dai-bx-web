import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Field from '@/core/components/molecules/field';
import PasswordInput from '@/core/components/molecules/password-input';
import AuthFrame from '@/features/auth/components/auth-frame';

const ResetPasswordPage = () => (
  <AuthFrame
    title="Choose a new password"
    description="Saving it signs you out on every device and forgets remembered ones. Then you’ll sign in with the new password and your authenticator."
    footer={
      <>
        Didn’t ask for this?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </>
    }
  >
    <form className="grid gap-4">
      <Field
        label="New password"
        htmlFor="reset-password"
        hint="15 to 128 characters. A few unrelated words make a strong one."
      >
        <PasswordInput id="reset-password" name="password" autoComplete="new-password" />
      </Field>
      <Button type="submit" size="lg" className="mt-2 w-full">
        Save new password
      </Button>
    </form>
  </AuthFrame>
);

export default ResetPasswordPage;
