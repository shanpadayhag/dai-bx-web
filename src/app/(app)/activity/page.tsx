import type { Metadata } from 'next';
import ActivityPage from '@/features/activity/pages/activity-page';

export const metadata: Metadata = { title: 'Activity' };

const ActivityRoute = () => <ActivityPage />;

export default ActivityRoute;
