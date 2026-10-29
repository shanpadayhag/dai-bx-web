import { expect, test } from 'vitest';
import { readGroupImport } from '@/features/tasks/entities/group-import-preview';

const planFileText = JSON.stringify({
  name: ' Today ',
  tasks: [
    {
      name: 'DaiBX – Wire the page',
      tasks: [{ name: 'Check it', tasks: [{ name: 'Deep', tasks: [] }] }],
    },
    { name: 'Chinese – Cards', tasks: [] },
  ],
});

test('previews a plan file: its name, task count, depth and top-level names', () => {
  const groupImport = readGroupImport('2026-10-29.json', planFileText);

  expect(groupImport).toMatchObject({
    kind: 'ready',
    preview: {
      fileName: '2026-10-29.json',
      groupName: 'Today',
      taskCount: 4,
      deepestLevel: 3,
      topLevelTaskNames: ['DaiBX – Wire the page', 'Chinese – Cards'],
    },
  });
});

test('keeps the parsed file to send as it is', () => {
  const groupImport = readGroupImport('plan.json', planFileText);

  expect(groupImport.kind === 'ready' && groupImport.importFile).toEqual(JSON.parse(planFileText));
});

test('refuses a file that is not JSON or not an object, before anything is sent', () => {
  expect(readGroupImport('notes.json', '{ nope')).toEqual({
    kind: 'problem',
    problem: { fileName: 'notes.json', message: "The file isn't valid JSON.", path: '' },
  });
  expect(readGroupImport('list.json', '[]')).toMatchObject({
    kind: 'problem',
    problem: { message: 'A group file is a JSON object.' },
  });
});

test('previews loosely and leaves the strict checks to the server', () => {
  const groupImport = readGroupImport('odd.json', JSON.stringify({ name: 3, tasks: 'none' }));

  expect(groupImport).toMatchObject({
    kind: 'ready',
    preview: { groupName: '', taskCount: 0, deepestLevel: 0, topLevelTaskNames: [] },
  });
});
