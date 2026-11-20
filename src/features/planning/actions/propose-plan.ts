import backendPlanSource from '@/features/planning/data_sources/backend/plan-source';
import type { PlanProposalRecord, PlanProposalRequest } from '@/features/planning/entities/plan';

const proposePlan = (proposalRequest: PlanProposalRequest): Promise<PlanProposalRecord> =>
  backendPlanSource.propose(proposalRequest);

export default proposePlan;
