import type { Metadata } from 'next';
import VerifyEmailPage from '@/features/auth/pages/verify-email-page';

export const metadata: Metadata = { title: 'Check your email' };

const VerifyEmailRoute = () => <VerifyEmailPage />;

export default VerifyEmailRoute;
