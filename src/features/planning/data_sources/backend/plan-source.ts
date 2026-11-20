import apiClient from '@/core/api/api-client';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type {
  PlanBlockWrite,
  PlanProposalRecord,
  PlanProposalRequest,
} from '@/features/planning/entities/plan';

type AcceptedPlanRecord = {
  events: CalendarEventRecord[];
};

const backendPlanSource = {
  propose: (proposalRequest: PlanProposalRequest) =>
    apiClient.post<PlanProposalRecord>('/plans/proposal', proposalRequest),
  accept: (blockWrites: readonly PlanBlockWrite[]) =>
    apiClient.post<AcceptedPlanRecord>('/plans/accept', { blocks: blockWrites }),
};

export type { AcceptedPlanRecord };
export default backendPlanSource;
