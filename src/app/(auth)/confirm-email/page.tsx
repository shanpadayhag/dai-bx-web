import type { Metadata } from 'next';
import ConfirmEmailPage from '@/features/auth/pages/confirm-email-page';

export const metadata: Metadata = { title: 'Confirm email' };

const ConfirmEmailRoute = () => <ConfirmEmailPage />;

export default ConfirmEmailRoute;
