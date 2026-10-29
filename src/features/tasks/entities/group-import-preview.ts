import type GroupImportProblem from '@/features/tasks/entities/group-import-problem';

type GroupImportPreview = {
  fileName: string;
  groupName: string;
  taskCount: number;
  deepestLevel: number;
  topLevelTaskNames: string[];
};

export type GroupImportReading =
  | { kind: 'ready'; preview: GroupImportPreview; importFile: unknown }
  | { kind: 'problem'; problem: GroupImportProblem };

type TaskListTally = {
  taskCount: number;
  deepestLevel: number;
};

const isPlainObject = (fileValue: unknown): fileValue is Record<string, unknown> =>
  typeof fileValue === 'object' && fileValue !== null && !Array.isArray(fileValue);

const readTaskList = (tasksValue: unknown): unknown[] =>
  Array.isArray(tasksValue) ? tasksValue : [];

const tallyTasks = (tasksValue: unknown, level: number): TaskListTally =>
  readTaskList(tasksValue).reduce<TaskListTally>(
    (tally, taskValue) => {
      const childTally = isPlainObject(taskValue)
        ? tallyTasks(taskValue.tasks, level + 1)
        : { taskCount: 0, deepestLevel: 0 };
      return {
        taskCount: tally.taskCount + 1 + childTally.taskCount,
        deepestLevel: Math.max(tally.deepestLevel, level, childTally.deepestLevel),
      };
    },
    { taskCount: 0, deepestLevel: 0 },
  );

const readName = (namedValue: unknown) =>
  isPlainObject(namedValue) && typeof namedValue.name === 'string' ? namedValue.name.trim() : '';

const problemFor = (fileName: string, message: string): GroupImportReading => ({
  kind: 'problem',
  problem: { fileName, message, path: '' },
});

export const readGroupImport = (fileName: string, fileText: string): GroupImportReading => {
  let importFile: unknown;
  try {
    importFile = JSON.parse(fileText);
  } catch {
    return problemFor(fileName, "The file isn't valid JSON.");
  }
  if (!isPlainObject(importFile)) return problemFor(fileName, 'A group file is a JSON object.');
  const taskTally = tallyTasks(importFile.tasks, 1);
  return {
    kind: 'ready',
    importFile,
    preview: {
      fileName,
      groupName: readName(importFile),
      taskCount: taskTally.taskCount,
      deepestLevel: taskTally.deepestLevel,
      topLevelTaskNames: readTaskList(importFile.tasks).map(readName),
    },
  };
};

export default GroupImportPreview;
