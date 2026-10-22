import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import AuthFrame from '@/features/auth/components/auth-frame';

const SignUpPage = () => (
  <AuthFrame
    title="Create your workspace"
    description="Tasks, a board and a calendar, set up in under a minute."
    footer={
      <>
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </>
    }
  >
    <form className="grid gap-4">
      <Field label="Name" htmlFor="sign-up-name">
        <Input id="sign-up-name" autoComplete="name" placeholder="What should we call you?" />
      </Field>
      <Field label="Email" htmlFor="sign-up-email">
        <Input id="sign-up-email" type="email" autoComplete="email" placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="sign-up-password" hint="At least 12 characters.">
        <Input id="sign-up-password" type="password" autoComplete="new-password" />
      </Field>
      <Button type="submit" size="lg" className="mt-2 w-full">
        Create account
      </Button>
    </form>
  </AuthFrame>
);

export default SignUpPage;
