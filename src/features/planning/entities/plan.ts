import type { EventTimes } from '@/features/calendar/entities/calendar-drag';

type PlanDayCount = 1 | 7;

type UnplacedReason = 'noEstimate' | 'alreadyPlanned' | 'running' | 'doesNotFit' | 'tooMany';

type ProposedBlockRecord = {
  taskId: string;
  taskName: string;
  groupId: string;
  groupName: string;
  startsAt: string;
  endsAt: string;
  due: string | null;
  late: boolean;
};

type UnplacedTaskRecord = {
  taskId: string;
  taskName: string;
  groupName: string;
  reason: UnplacedReason;
};

type PlanProposalRecord = {
  planStart: string;
  rangeEnd: string;
  blocks: ProposedBlockRecord[];
  unplaced: UnplacedTaskRecord[];
};

type ProposedBlock = {
  taskId: string;
  taskName: string;
  groupId: string;
  groupName: string;
  startsAt: Date;
  endsAt: Date;
  due: Date | null;
  isLate: boolean;
  isPinned: boolean;
};

type UnplacedTask = {
  taskId: string;
  taskName: string;
  groupName: string;
  reason: UnplacedReason;
};

type PlanChoice = {
  dayCount: PlanDayCount;
  groupIds: readonly string[] | null;
};

type Plan = PlanChoice & {
  blocks: readonly ProposedBlock[];
  unplaced: readonly UnplacedTask[];
  excludedTaskIds: readonly string[];
};

type PlanBlockWrite = {
  taskId: string;
  startsAt: string;
  endsAt: string;
};

type PlanProposalRequest = {
  days: PlanDayCount;
  groupIds?: readonly string[];
  excludeTaskIds: readonly string[];
  pinned: readonly PlanBlockWrite[];
};

const PROPOSED_EVENT_ID_PREFIX = 'proposed:';

const UNPLACED_REASON_LABELS: Record<UnplacedReason, string> = {
  noEstimate: 'No estimate',
  doesNotFit: 'Doesn’t fit',
  alreadyPlanned: 'Already planned',
  running: 'Running now',
  tooMany: 'Too many',
};

const isLateBlock = (due: Date | null, endsAt: Date): boolean =>
  due !== null && endsAt.getTime() > due.getTime();

const proposedBlockFromRecord = (blockRecord: ProposedBlockRecord): ProposedBlock => ({
  taskId: blockRecord.taskId,
  taskName: blockRecord.taskName,
  groupId: blockRecord.groupId,
  groupName: blockRecord.groupName,
  startsAt: new Date(blockRecord.startsAt),
  endsAt: new Date(blockRecord.endsAt),
  due: blockRecord.due === null ? null : new Date(blockRecord.due),
  isLate: blockRecord.late,
  isPinned: false,
});

const byStart = (firstBlock: ProposedBlock, secondBlock: ProposedBlock) =>
  firstBlock.startsAt.getTime() - secondBlock.startsAt.getTime();

const planFromProposal = (
  proposalRecord: PlanProposalRecord,
  planChoice: PlanChoice,
  pinnedBlocks: readonly ProposedBlock[],
  excludedTaskIds: readonly string[],
): Plan => ({
  ...planChoice,
  blocks: [...pinnedBlocks, ...proposalRecord.blocks.map(proposedBlockFromRecord)].sort(byStart),
  unplaced: proposalRecord.unplaced,
  excludedTaskIds,
});

const pinnedBlocksOf = (plan: Plan): readonly ProposedBlock[] =>
  plan.blocks.filter((proposedBlock) => proposedBlock.isPinned);

const blockWriteOf = (proposedBlock: ProposedBlock): PlanBlockWrite => ({
  taskId: proposedBlock.taskId,
  startsAt: proposedBlock.startsAt.toISOString(),
  endsAt: proposedBlock.endsAt.toISOString(),
});

const proposalRequestOf = (
  planChoice: PlanChoice,
  pinnedBlocks: readonly ProposedBlock[],
  excludedTaskIds: readonly string[],
): PlanProposalRequest => ({
  days: planChoice.dayCount,
  ...(planChoice.groupIds === null ? {} : { groupIds: planChoice.groupIds }),
  excludeTaskIds: excludedTaskIds,
  pinned: pinnedBlocks.map(blockWriteOf),
});

const withPinnedBlock = (plan: Plan, taskId: string, blockTimes: EventTimes): Plan => ({
  ...plan,
  blocks: plan.blocks
    .map((proposedBlock) =>
      proposedBlock.taskId === taskId
        ? {
            ...proposedBlock,
            startsAt: blockTimes.startsAt,
            endsAt: blockTimes.endsAt,
            isLate: isLateBlock(proposedBlock.due, blockTimes.endsAt),
            isPinned: true,
          }
        : proposedBlock,
    )
    .sort(byStart),
});

const withoutBlocks = (plan: Plan, taskIds: readonly string[]): Plan => ({
  ...plan,
  blocks: plan.blocks.filter((proposedBlock) => !taskIds.includes(proposedBlock.taskId)),
});

const proposedEventId = (taskId: string): string => `${PROPOSED_EVENT_ID_PREFIX}${taskId}`;

const proposedTaskIdOf = (eventId: string): string | null =>
  eventId.startsWith(PROPOSED_EVENT_ID_PREFIX)
    ? eventId.slice(PROPOSED_EVENT_ID_PREFIX.length)
    : null;

export type {
  Plan,
  PlanBlockWrite,
  PlanChoice,
  PlanDayCount,
  PlanProposalRecord,
  PlanProposalRequest,
  ProposedBlock,
  ProposedBlockRecord,
  UnplacedReason,
  UnplacedTask,
  UnplacedTaskRecord,
};
export {
  UNPLACED_REASON_LABELS,
  blockWriteOf,
  pinnedBlocksOf,
  planFromProposal,
  proposalRequestOf,
  proposedEventId,
  proposedTaskIdOf,
  withPinnedBlock,
  withoutBlocks,
};
