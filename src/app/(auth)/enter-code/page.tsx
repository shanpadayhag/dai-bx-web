import type { Metadata } from 'next';
import EnterCodePage from '@/features/auth/pages/enter-code-page';

export const metadata: Metadata = { title: 'Enter your code' };

const EnterCodeRoute = () => <EnterCodePage />;

export default EnterCodeRoute;
