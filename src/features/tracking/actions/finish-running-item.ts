import AppError from '@/core/app-error';
import backendTrackingSource from '@/features/tracking/data_sources/backend/tracking-source';
import type { EndChoice } from '@/features/tracking/entities/finish-end';
import type FinishedItemRecord from '@/features/tracking/entities/finished-item-record';
import type RunningItem from '@/features/tracking/entities/running-item';

type FinishRunningItemParams = {
  runningItem: RunningItem;
  endChoice: EndChoice;
  customEndsAt: Date;
  markDone: boolean;
  now: Date;
};

export const resolveFinishEnd = ({
  runningItem,
  endChoice,
  customEndsAt,
  now,
}: Omit<FinishRunningItemParams, 'markDone'>): Date => {
  if (endChoice === 'now') return now;
  if (endChoice === 'last-check-in') {
    if (runningItem.lastAnsweredAt === null) {
      throw new AppError('Pick the End', 'There is no check-in yet, so pick now or set a time.');
    }
    return runningItem.lastAnsweredAt;
  }
  if (Number.isNaN(customEndsAt.getTime())) {
    throw new AppError('Pick the End', 'Choose a day and a time for the end.');
  }
  if (customEndsAt <= runningItem.startedAt) {
    throw new AppError('Check the End', 'It ends after it started.');
  }
  if (customEndsAt > now) {
    throw new AppError('Check the End', "It can't end in the future.");
  }
  return customEndsAt;
};

const finishRunningItem = (params: FinishRunningItemParams): Promise<FinishedItemRecord> => {
  const endsAt = resolveFinishEnd(params);
  return backendTrackingSource.finish(params.runningItem.id, {
    endsAt: endsAt.toISOString(),
    markDone: params.runningItem.sourceKind === 'task' && params.markDone,
  });
};

export default finishRunningItem;
