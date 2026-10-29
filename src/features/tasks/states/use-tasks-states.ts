import { useState } from 'react';
import type AppError from '@/core/app-error';
import type { TaskView } from '@/features/tasks/data_sources/local_storage/task-view-source';
import type { GroupImportReading } from '@/features/tasks/entities/group-import-preview';
import type MoveTarget from '@/features/tasks/entities/move-target';
import type { OptimisticGroupTasks } from '@/features/tasks/entities/optimistic-group-tasks';
import type TaskRecord from '@/features/tasks/entities/task-record';
import type TaskGroup from '@/features/tasks/entities/task-group';

const useTasksStates = () => {
  const [taskGroups, setTaskGroups] = useState<readonly TaskGroup[] | null>(null);
  const [pageLoadError, setPageLoadError] = useState<AppError | null>(null);
  const [selectedTaskGroupId, setSelectedTaskGroupId] = useState<string | null>(null);
  const [optimisticGroupTasks, setOptimisticGroupTasks] = useState<OptimisticGroupTasks | null>(
    null,
  );
  const [taskView, setTaskView] = useState<TaskView>('all');
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<ReadonlySet<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [addingSubtaskToId, setAddingSubtaskToId] = useState<string | null>(null);
  const [deleteTargetTaskId, setDeleteTargetTaskId] = useState<string | null>(null);
  const [submittingDialogId, setSubmittingDialogId] = useState<string | null>(null);
  const [actionsTargetTaskId, setActionsTargetTaskId] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [moveDialogGroupId, setMoveDialogGroupId] = useState<string | null>(null);
  const [moveDialogRecords, setMoveDialogRecords] = useState<readonly TaskRecord[] | null>(null);
  const [moveDialogTargets, setMoveDialogTargets] = useState<readonly MoveTarget[] | null>(null);
  const [groupImportReading, setGroupImportReading] = useState<GroupImportReading | null>(null);

  return {
    taskGroups,
    setTaskGroups,
    pageLoadError,
    setPageLoadError,
    selectedTaskGroupId,
    setSelectedTaskGroupId,
    optimisticGroupTasks,
    setOptimisticGroupTasks,
    taskView,
    setTaskView,
    collapsedTaskIds,
    setCollapsedTaskIds,
    editingTaskId,
    setEditingTaskId,
    addingSubtaskToId,
    setAddingSubtaskToId,
    deleteTargetTaskId,
    setDeleteTargetTaskId,
    submittingDialogId,
    setSubmittingDialogId,
    actionsTargetTaskId,
    setActionsTargetTaskId,
    movingTaskId,
    setMovingTaskId,
    moveDialogGroupId,
    setMoveDialogGroupId,
    moveDialogRecords,
    setMoveDialogRecords,
    moveDialogTargets,
    setMoveDialogTargets,
    groupImportReading,
    setGroupImportReading,
  };
};

export default useTasksStates;
