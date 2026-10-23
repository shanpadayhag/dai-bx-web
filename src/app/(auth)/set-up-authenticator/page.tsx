import type { Metadata } from 'next';
import SetUpAuthenticatorPage from '@/features/auth/pages/set-up-authenticator-page';

export const metadata: Metadata = { title: 'Add an authenticator' };

const SetUpAuthenticatorRoute = () => <SetUpAuthenticatorPage />;

export default SetUpAuthenticatorRoute;
