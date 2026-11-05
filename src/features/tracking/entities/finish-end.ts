import type RunningItem from '@/features/tracking/entities/running-item';

type EndChoice = 'last-check-in' | 'now' | 'custom';

type AwayReason = 'answered-no' | 'unanswered';

type FinishAway = {
  reason: AwayReason;
  since: Date;
};

const END_CHOICES: readonly EndChoice[] = ['last-check-in', 'now', 'custom'];

const isEndChoice = (choiceText: string): choiceText is EndChoice =>
  (END_CHOICES as readonly string[]).includes(choiceText);

const initialEndChoice = (runningItem: RunningItem, finishAway: FinishAway | null): EndChoice => {
  if (finishAway === null) return 'now';
  return runningItem.lastAnsweredAt === null ? 'custom' : 'last-check-in';
};

export type { AwayReason, EndChoice, FinishAway };
export { initialEndChoice, isEndChoice };
