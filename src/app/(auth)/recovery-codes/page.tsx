import type { Metadata } from 'next';
import RecoveryCodesPage from '@/features/auth/pages/recovery-codes-page';

export const metadata: Metadata = { title: 'Recovery codes' };

const RecoveryCodesRoute = () => <RecoveryCodesPage />;

export default RecoveryCodesRoute;
