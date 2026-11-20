import type { GroupTasks } from '@/features/tasks/entities/group-tasks';

type TaskChoice = {
  id: string;
  name: string;
  isDone: boolean;
};

const topLevelTaskChoices = (groupTasks: GroupTasks): readonly TaskChoice[] =>
  groupTasks.tasks
    .filter((taskRecord) => taskRecord.parentId === null)
    .sort((firstTask, secondTask) => firstTask.position - secondTask.position)
    .map((taskRecord) => ({ id: taskRecord.id, name: taskRecord.name, isDone: taskRecord.isDone }));

const linkableTaskChoices = (
  taskChoices: readonly TaskChoice[],
  linkedTaskId: string | null,
): readonly TaskChoice[] =>
  taskChoices.filter((taskChoice) => !taskChoice.isDone || taskChoice.id === linkedTaskId);

export type { TaskChoice };
export { linkableTaskChoices, topLevelTaskChoices };
