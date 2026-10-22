import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/pages/settings-page';

export const metadata: Metadata = { title: 'Settings' };

const SettingsRoute = () => <SettingsPage />;

export default SettingsRoute;
