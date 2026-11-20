import { expect, test } from 'vitest';
import {
  pinnedBlocksOf,
  planFromProposal,
  proposalRequestOf,
  proposedEventId,
  proposedTaskIdOf,
  withPinnedBlock,
  withoutBlocks,
  type PlanProposalRecord,
} from '@/features/planning/entities/plan';

const proposalRecord: PlanProposalRecord = {
  planStart: '2026-11-20T09:00:00.000Z',
  rangeEnd: '2026-11-20T17:00:00.000Z',
  blocks: [
    {
      taskId: 'task-b',
      taskName: 'Second',
      groupId: 'group-work',
      groupName: 'Work',
      startsAt: '2026-11-20T10:00:00.000Z',
      endsAt: '2026-11-20T11:00:00.000Z',
      due: null,
      late: false,
    },
    {
      taskId: 'task-a',
      taskName: 'First',
      groupId: 'group-work',
      groupName: 'Work',
      startsAt: '2026-11-20T09:00:00.000Z',
      endsAt: '2026-11-20T10:00:00.000Z',
      due: '2026-11-20T12:00:00.000Z',
      late: false,
    },
  ],
  unplaced: [{ taskId: 'task-c', taskName: 'Third', groupName: 'Work', reason: 'noEstimate' }],
};

const sevenDays = { dayCount: 7, groupIds: null } as const;

test('a proposal becomes a plan with its blocks in time order', () => {
  const plan = planFromProposal(proposalRecord, sevenDays, [], []);

  expect(plan.blocks.map((proposedBlock) => proposedBlock.taskId)).toEqual(['task-a', 'task-b']);
  expect(plan.blocks[0]?.due).toEqual(new Date('2026-11-20T12:00:00.000Z'));
  expect(plan.unplaced).toHaveLength(1);
});

test('moving a block pins it and checks it against its due time', () => {
  const plan = planFromProposal(proposalRecord, sevenDays, [], []);

  const movedPlan = withPinnedBlock(plan, 'task-a', {
    startsAt: new Date('2026-11-20T12:00:00.000Z'),
    endsAt: new Date('2026-11-20T13:00:00.000Z'),
  });

  expect(movedPlan.blocks.map((proposedBlock) => proposedBlock.taskId)).toEqual([
    'task-b',
    'task-a',
  ]);
  expect(pinnedBlocksOf(movedPlan)).toEqual([
    expect.objectContaining({ taskId: 'task-a', isPinned: true, isLate: true }),
  ]);
});

test('asking again sends the groups, the excluded tasks and the pinned blocks', () => {
  const plan = withPinnedBlock(planFromProposal(proposalRecord, sevenDays, [], []), 'task-a', {
    startsAt: new Date('2026-11-20T15:00:00.000Z'),
    endsAt: new Date('2026-11-20T16:00:00.000Z'),
  });

  expect(
    proposalRequestOf({ dayCount: 1, groupIds: ['group-work'] }, pinnedBlocksOf(plan), ['task-b']),
  ).toEqual({
    days: 1,
    groupIds: ['group-work'],
    excludeTaskIds: ['task-b'],
    pinned: [
      {
        taskId: 'task-a',
        startsAt: '2026-11-20T15:00:00.000Z',
        endsAt: '2026-11-20T16:00:00.000Z',
      },
    ],
  });
  expect(proposalRequestOf(sevenDays, [], [])).toEqual({ days: 7, excludeTaskIds: [], pinned: [] });
});

test('pinned blocks stay in the next plan and accepted blocks leave it', () => {
  const firstPlan = withPinnedBlock(planFromProposal(proposalRecord, sevenDays, [], []), 'task-a', {
    startsAt: new Date('2026-11-20T15:00:00.000Z'),
    endsAt: new Date('2026-11-20T16:00:00.000Z'),
  });

  const nextPlan = planFromProposal(
    { ...proposalRecord, blocks: [proposalRecord.blocks[0]!] },
    sevenDays,
    pinnedBlocksOf(firstPlan),
    [],
  );

  expect(nextPlan.blocks.map((proposedBlock) => proposedBlock.taskId)).toEqual([
    'task-b',
    'task-a',
  ]);
  expect(withoutBlocks(nextPlan, ['task-b']).blocks).toHaveLength(1);
  expect(proposedTaskIdOf(proposedEventId('task-a'))).toBe('task-a');
  expect(proposedTaskIdOf('event-1')).toBeNull();
});
