import backendTrackingSource from '@/features/tracking/data_sources/backend/tracking-source';
import type RunningItem from '@/features/tracking/entities/running-item';
import { runningItemFromRecord } from '@/features/tracking/entities/running-item';

const checkInRunningItem = async (eventId: RunningItem['id']): Promise<RunningItem> =>
  runningItemFromRecord(await backendTrackingSource.checkIn(eventId));

export default checkInRunningItem;
