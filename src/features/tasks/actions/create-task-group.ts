import AppError from '@/core/app-error';
import type { RepeatRule } from '@/core/repeat-rule';
import backendTaskGroupSource, {
  type TaskGroupDraft,
} from '@/features/tasks/data_sources/backend/task-group-source';
import type { GroupShows, GroupUnchecks } from '@/features/tasks/entities/group-schedule';
import type TaskGroup from '@/features/tasks/entities/task-group';

export type GroupFormEntry = {
  taskGroupName: string;
  showRule: RepeatRule | null;
  windowStart: string;
  windowEnd: string;
  uncheckRule: RepeatRule | null;
  uncheckTime: string;
};

const readGroupShows = (groupFormEntry: GroupFormEntry): GroupShows | null => {
  if (groupFormEntry.showRule === null) return null;
  const windowStart = groupFormEntry.windowStart === '' ? null : groupFormEntry.windowStart;
  const windowEnd = groupFormEntry.windowEnd === '' ? null : groupFormEntry.windowEnd;
  if ((windowStart === null) !== (windowEnd === null)) {
    throw new AppError(
      'Finish the window',
      'Give it both a start and an end, or leave both empty.',
    );
  }
  if (windowStart !== null && windowStart === windowEnd) {
    throw new AppError('Check the window', 'It needs to start and end at different times.');
  }
  return { repeat: groupFormEntry.showRule, windowStart, windowEnd };
};

const readGroupUnchecks = (groupFormEntry: GroupFormEntry): GroupUnchecks | null => {
  if (groupFormEntry.uncheckRule === null) return null;
  if (groupFormEntry.uncheckTime === '') {
    throw new AppError('Pick a time', 'Choose when the tasks untick.');
  }
  return { repeat: groupFormEntry.uncheckRule, time: groupFormEntry.uncheckTime };
};

export const readTaskGroupDraft = (
  groupFormEntry: GroupFormEntry,
  missingNameDescription: string,
): TaskGroupDraft => {
  const trimmedTaskGroupName = groupFormEntry.taskGroupName.trim();
  if (trimmedTaskGroupName === '') {
    throw new AppError('Name the group', missingNameDescription);
  }
  return {
    name: trimmedTaskGroupName,
    shows: readGroupShows(groupFormEntry),
    unchecks: readGroupUnchecks(groupFormEntry),
  };
};

const createTaskGroup = async (groupFormEntry: GroupFormEntry): Promise<TaskGroup> =>
  backendTaskGroupSource.create(
    readTaskGroupDraft(groupFormEntry, 'Give it a name, like a project or a day.'),
  );

export default createTaskGroup;
