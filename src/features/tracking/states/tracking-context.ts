import { createContext, useContext } from 'react';
import { deviceTimeZone } from '@/core/time-zone';
import type FinishedItemRecord from '@/features/tracking/entities/finished-item-record';
import type RunningItem from '@/features/tracking/entities/running-item';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';

type TrackingContextValue = {
  runningItems: readonly RunningItem[];
  runningSourceIds: ReadonlySet<string>;
  trackingRevision: number;
  lastFinishedItem: FinishedItemRecord | null;
  calendarTimeZone: string;
  timeTrackingSettings: TimeTrackingSettings | null;
  trackingNow: Date;
  handleStartTask: (taskId: string) => Promise<boolean>;
  handleStartCard: (cardId: string) => Promise<boolean>;
  handleOpenFinish: (eventId: string) => void;
  handleCheckIn: (eventId: string) => void;
  handleApplyTimeTrackingSettings: (timeTrackingSettings: TimeTrackingSettings) => void;
};

const doNothing = () => undefined;
const startNothing = () => Promise.resolve(false);

export const TrackingContext = createContext<TrackingContextValue>({
  runningItems: [],
  runningSourceIds: new Set(),
  trackingRevision: 0,
  lastFinishedItem: null,
  calendarTimeZone: deviceTimeZone(),
  timeTrackingSettings: null,
  trackingNow: new Date(),
  handleStartTask: startNothing,
  handleStartCard: startNothing,
  handleOpenFinish: doNothing,
  handleCheckIn: doNothing,
  handleApplyTimeTrackingSettings: doNothing,
});

export const useTracking = () => useContext(TrackingContext);

export type { TrackingContextValue };
