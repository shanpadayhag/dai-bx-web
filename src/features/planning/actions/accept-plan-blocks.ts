import backendPlanSource, {
  type AcceptedPlanRecord,
} from '@/features/planning/data_sources/backend/plan-source';
import { blockWriteOf, type ProposedBlock } from '@/features/planning/entities/plan';

const acceptPlanBlocks = (proposedBlocks: readonly ProposedBlock[]): Promise<AcceptedPlanRecord> =>
  backendPlanSource.accept(proposedBlocks.map(blockWriteOf));

export default acceptPlanBlocks;
