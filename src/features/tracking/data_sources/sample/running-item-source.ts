import type RunningItem from '@/features/tracking/entities/running-item';

const sampleMoment = (hour: number, minute: number, second = 0) =>
  new Date(2026, 10, 5, hour, minute, second);

const runningItems: RunningItem[] = [
  {
    id: 'board-release',
    title: 'Plan the board release',
    sourceKind: 'card',
    sourceName: 'Projects',
    startedAt: sampleMoment(17, 15),
    lastAnsweredAt: null,
    estimateMinutes: null,
  },
  {
    id: 'v3-changelog',
    title: 'Write the v3 changelog',
    sourceKind: 'task',
    sourceName: 'DaiBX',
    startedAt: sampleMoment(16, 20),
    lastAnsweredAt: sampleMoment(17, 20),
    estimateMinutes: 45,
  },
];

const sampleRunningItemSource = {
  findNow: (): Date => sampleMoment(18, 2, 8),
  findRunning: (): RunningItem[] => runningItems,
};

export default sampleRunningItemSource;
