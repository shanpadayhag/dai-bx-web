import { expect, test } from 'vitest';
import { linkableTaskChoices, topLevelTaskChoices } from '@/features/calendar/entities/task-choice';
import type TaskRecord from '@/features/tasks/entities/task-record';

const taskRecord = (
  id: string,
  parentId: string | null,
  position: number,
  isDone = false,
): TaskRecord => ({
  id,
  name: `Task ${id}`,
  parentId,
  position,
  isDone,
  estimateMinutes: null,
  card: null,
  trackedEventCount: 0,
  priority: 'normal',
  due: null,
  planBetween: null,
});

test('offers open top-level tasks in list order, and keeps the linked one even when done', () => {
  const groupTasks = {
    group: { id: 'group-today', name: 'Today' },
    tasks: [
      taskRecord('second', null, 1),
      taskRecord('child', 'second', 0),
      taskRecord('done', null, 2, true),
      taskRecord('first', null, 0),
      taskRecord('linked', null, 3, true),
    ],
    openCount: 3,
    doneCount: 2,
  };

  expect(
    linkableTaskChoices(topLevelTaskChoices(groupTasks), 'linked').map(
      (taskChoice) => taskChoice.id,
    ),
  ).toEqual(['first', 'second', 'linked']);
});
