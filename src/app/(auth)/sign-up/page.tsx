import type { Metadata } from 'next';
import SignUpPage from '@/features/auth/pages/sign-up-page';

export const metadata: Metadata = { title: 'Create an account' };

const SignUpRoute = () => <SignUpPage />;

export default SignUpRoute;
