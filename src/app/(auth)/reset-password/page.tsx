import type { Metadata } from 'next';
import ResetPasswordPage from '@/features/auth/pages/reset-password-page';

export const metadata: Metadata = { title: 'Choose a new password' };

const ResetPasswordRoute = () => <ResetPasswordPage />;

export default ResetPasswordRoute;
