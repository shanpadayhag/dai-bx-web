import apiClient from '@/core/api/api-client';
import type { RepeatRule } from '@/core/repeat-rule';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type { CardScheduleKind } from '@/features/board/entities/card-schedule';
import type CardScheduleRecord from '@/features/board/entities/card-schedule-record';
import type {
  CardSchedulesRecord,
  ScheduleBlockRecord,
  ScheduleRunRecord,
} from '@/features/board/entities/card-schedule-record';

type ScheduleWrite = {
  kind: CardScheduleKind;
  targetListId: string;
  start: string;
  inputZone: string;
  timeZone?: string;
  repeat?: RepeatRule;
  block?: ScheduleBlockRecord | null;
};

type RunsPage = {
  before?: string;
  limit?: number;
};

const runsSearch = (runsPage: RunsPage): string => {
  const searchParams = new URLSearchParams();
  if (runsPage.before !== undefined) searchParams.set('before', runsPage.before);
  if (runsPage.limit !== undefined) searchParams.set('limit', String(runsPage.limit));
  const searchText = searchParams.toString();
  return searchText === '' ? '' : `?${searchText}`;
};

const backendCardScheduleSource = {
  create: (cardId: BoardCardRecord['id'], scheduleWrite: ScheduleWrite) =>
    apiClient.post<CardSchedulesRecord>(`/cards/${cardId}/schedules`, scheduleWrite),
  update: (scheduleId: CardScheduleRecord['id'], scheduleWrite: ScheduleWrite) =>
    apiClient.patch<CardSchedulesRecord>(`/schedules/${scheduleId}`, scheduleWrite),
  delete: (scheduleId: CardScheduleRecord['id']) =>
    apiClient.delete<CardSchedulesRecord>(`/schedules/${scheduleId}`),
  pause: (scheduleId: CardScheduleRecord['id']) =>
    apiClient.post<CardScheduleRecord>(`/schedules/${scheduleId}/pause`),
  resume: (scheduleId: CardScheduleRecord['id']) =>
    apiClient.post<CardScheduleRecord>(`/schedules/${scheduleId}/resume`),
  runNow: (scheduleId: CardScheduleRecord['id']) =>
    apiClient.post<CardScheduleRecord>(`/schedules/${scheduleId}/run-now`),
  listRuns: (scheduleId: CardScheduleRecord['id'], runsPage: RunsPage = {}) =>
    apiClient.get<ScheduleRunRecord[]>(`/schedules/${scheduleId}/runs${runsSearch(runsPage)}`),
};

export type { RunsPage, ScheduleWrite };
export default backendCardScheduleSource;
