import type { Metadata } from 'next';
import ForgotPasswordPage from '@/features/auth/pages/forgot-password-page';

export const metadata: Metadata = { title: 'Reset your password' };

const ForgotPasswordRoute = () => <ForgotPasswordPage />;

export default ForgotPasswordRoute;
