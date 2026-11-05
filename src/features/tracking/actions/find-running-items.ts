import backendTrackingSource from '@/features/tracking/data_sources/backend/tracking-source';
import type RunningItem from '@/features/tracking/entities/running-item';
import { runningItemFromRecord } from '@/features/tracking/entities/running-item';

const findRunningItems = async (): Promise<RunningItem[]> =>
  (await backendTrackingSource.listRunning()).map(runningItemFromRecord);

export default findRunningItems;
