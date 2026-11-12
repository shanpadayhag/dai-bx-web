import type { GroupView } from '@/features/tasks/entities/group-schedule';

export type TaskView = 'open' | 'all';

const LAST_TASK_GROUP_ID_KEY = 'daibx:last-task-group-id';
const TASK_VIEW_KEY = 'daibx:task-view';
const GROUP_VIEW_KEY = 'daibx:group-view';

const readStoredText = (storageKey: string) => {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
};

const writeStoredText = (storageKey: string, storedText: string) => {
  try {
    window.localStorage.setItem(storageKey, storedText);
  } catch {
    return;
  }
};

const localStorageTaskViewSource = {
  findLastTaskGroupId: () => readStoredText(LAST_TASK_GROUP_ID_KEY),
  saveLastTaskGroupId: (taskGroupId: string) =>
    writeStoredText(LAST_TASK_GROUP_ID_KEY, taskGroupId),
  findTaskView: (): TaskView => (readStoredText(TASK_VIEW_KEY) === 'open' ? 'open' : 'all'),
  saveTaskView: (taskView: TaskView) => writeStoredText(TASK_VIEW_KEY, taskView),
  findGroupView: (): GroupView => (readStoredText(GROUP_VIEW_KEY) === 'all' ? 'all' : 'due'),
  saveGroupView: (groupView: GroupView) => writeStoredText(GROUP_VIEW_KEY, groupView),
};

export default localStorageTaskViewSource;
