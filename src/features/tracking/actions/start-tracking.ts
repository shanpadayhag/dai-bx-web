import backendTrackingSource from '@/features/tracking/data_sources/backend/tracking-source';
import type RunningItem from '@/features/tracking/entities/running-item';
import {
  runningItemFromRecord,
  type RunningItemSourceKind,
} from '@/features/tracking/entities/running-item';

type StartTrackingParams = {
  sourceKind: RunningItemSourceKind;
  sourceId: string;
};

const startTracking = async ({ sourceKind, sourceId }: StartTrackingParams): Promise<RunningItem> =>
  runningItemFromRecord(
    sourceKind === 'task'
      ? await backendTrackingSource.startTask(sourceId)
      : await backendTrackingSource.startCard(sourceId),
  );

export default startTracking;
