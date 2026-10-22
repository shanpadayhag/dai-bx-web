import type { Metadata } from 'next';
import TodayPage from '@/features/today/pages/today-page';

export const metadata: Metadata = { title: 'Today' };

const TodayRoute = () => <TodayPage />;

export default TodayRoute;
