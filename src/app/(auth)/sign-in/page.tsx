import type { Metadata } from 'next';
import SignInPage from '@/features/auth/pages/sign-in-page';

export const metadata: Metadata = { title: 'Sign in' };

const SignInRoute = () => <SignInPage />;

export default SignInRoute;
