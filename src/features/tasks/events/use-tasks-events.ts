import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, type FormEvent } from 'react';
import { ApiError } from '@/core/api/api-error';
import AppError from '@/core/app-error';
import readFormText from '@/core/form-text';
import hidePopover from '@/core/popover';
import reportAppError from '@/core/report-app-error';
import findCategories from '@/features/categories/actions/find-categories';
import addTask from '@/features/tasks/actions/add-task';
import createTaskGroup from '@/features/tasks/actions/create-task-group';
import deleteTask from '@/features/tasks/actions/delete-task';
import deleteTaskGroup from '@/features/tasks/actions/delete-task-group';
import findGroupTasks from '@/features/tasks/actions/find-group-tasks';
import findTaskGroups from '@/features/tasks/actions/find-task-groups';
import importGroup from '@/features/tasks/actions/import-group';
import moveTask from '@/features/tasks/actions/move-task';
import setTaskDone from '@/features/tasks/actions/set-task-done';
import updateTask, { readTaskEdit } from '@/features/tasks/actions/update-task';
import updateTaskGroup from '@/features/tasks/actions/update-task-group';
import localStorageTaskViewSource, {
  type TaskView,
} from '@/features/tasks/data_sources/local_storage/task-view-source';
import { readGroupImport } from '@/features/tasks/entities/group-import-preview';
import type {
  AffectedGroup,
  GroupTasks,
  MovedGroupTasks,
} from '@/features/tasks/entities/group-tasks';
import { buildMoveTargets } from '@/features/tasks/entities/move-target';
import {
  confirmWrite,
  failWrite,
  startOptimisticGroupTasks,
  startWrite,
  visibleGroupTasks,
} from '@/features/tasks/entities/optimistic-group-tasks';
import type TaskGroup from '@/features/tasks/entities/task-group';
import type TaskRecord from '@/features/tasks/entities/task-record';
import {
  collectSubtreeIds,
  type LocalTaskChange,
} from '@/features/tasks/entities/task-record-changes';
import type useTasksStates from '@/features/tasks/states/use-tasks-states';

export const NEW_GROUP_DIALOG_ID = 'new-group-dialog';
export const GROUP_SETTINGS_DIALOG_ID = 'group-settings-dialog';
export const DELETE_GROUP_DIALOG_ID = 'delete-group-dialog';
export const DELETE_TASK_DIALOG_ID = 'delete-task-dialog';
export const TASK_ACTIONS_MENU_ID = 'task-actions-menu';
export const MOVE_TASK_DIALOG_ID = 'move-task-dialog';
export const IMPORT_GROUP_DIALOG_ID = 'import-group-dialog';
const MAX_IMPORT_FILE_BYTES = 1024 * 1024;
const TASKS_PATH = '/tasks';
const GROUP_QUERY_NAME = 'group';
const PENDING_TASK_ID_PREFIX = 'pending-task-';

const readGroupForm = (submittedForm: HTMLFormElement) => {
  const groupFormData = new FormData(submittedForm);
  const chosenCategoryId = readFormText(groupFormData, 'groupCategory');
  return {
    taskGroupName: readFormText(groupFormData, 'groupName'),
    categoryId: chosenCategoryId === '' ? null : chosenCategoryId,
  };
};

const countSiblings = (
  taskRecords: readonly TaskRecord[],
  parentTaskId: string | null,
  excludedTaskId: string,
) =>
  taskRecords.filter(
    (taskRecord) => taskRecord.parentId === parentTaskId && taskRecord.id !== excludedTaskId,
  ).length;

const showPopover = (popoverId: string) => {
  const popoverElement = document.getElementById(popoverId);
  if (popoverElement === null || typeof popoverElement.showPopover !== 'function') return;
  if (!popoverElement.matches(':popover-open')) popoverElement.showPopover();
};

const pickStartingGroupId = (taskGroups: readonly TaskGroup[]) => {
  const isKnownGroup = (taskGroupId: string | null) =>
    taskGroupId !== null && taskGroups.some((taskGroup) => taskGroup.id === taskGroupId);
  const addressedGroupId = new URLSearchParams(window.location.search).get(GROUP_QUERY_NAME);
  if (isKnownGroup(addressedGroupId)) return addressedGroupId;
  const lastTaskGroupId = localStorageTaskViewSource.findLastTaskGroupId();
  if (isKnownGroup(lastTaskGroupId)) return lastTaskGroupId;
  return taskGroups[0]?.id ?? null;
};

const useTasksEvents = (states: ReturnType<typeof useTasksStates>) => {
  const {
    taskGroups,
    selectedTaskGroupId,
    deleteTargetTaskId,
    optimisticGroupTasks,
    movingTaskId,
    moveDialogGroupId,
    moveDialogRecords,
    groupImportReading,
    setTaskGroups,
    setCategories,
    setPageLoadError,
    setSelectedTaskGroupId,
    setOptimisticGroupTasks,
    setTaskView,
    setCollapsedTaskIds,
    setEditingTaskId,
    setAddingSubtaskToId,
    setDeleteTargetTaskId,
    setSubmittingDialogId,
    setActionsTargetTaskId,
    setMovingTaskId,
    setMoveDialogGroupId,
    setMoveDialogRecords,
    setMoveDialogTargets,
    setGroupImportReading,
  } = states;
  const router = useRouter();
  const lastWriteIdRef = useRef(0);

  const refreshSidebarCounts = useCallback(
    (groupTasks: GroupTasks) =>
      setTaskGroups((currentTaskGroups) =>
        currentTaskGroups === null
          ? currentTaskGroups
          : currentTaskGroups.map((taskGroup) =>
              taskGroup.id === groupTasks.group.id
                ? {
                    ...taskGroup,
                    openTaskCount: groupTasks.openCount,
                    taskCount: groupTasks.tasks.length,
                  }
                : taskGroup,
            ),
      ),
    [setTaskGroups],
  );

  const openTaskGroup = useCallback(
    async (taskGroupId: string | null) => {
      setSelectedTaskGroupId(taskGroupId);
      setOptimisticGroupTasks(null);
      setEditingTaskId(null);
      setAddingSubtaskToId(null);
      setCollapsedTaskIds(new Set());
      if (taskGroupId === null) return;
      localStorageTaskViewSource.saveLastTaskGroupId(taskGroupId);
      try {
        const loadedGroupTasks = await findGroupTasks(taskGroupId);
        setOptimisticGroupTasks(startOptimisticGroupTasks(loadedGroupTasks));
        refreshSidebarCounts(loadedGroupTasks);
      } catch (loadError) {
        reportAppError(loadError);
      }
    },
    [
      refreshSidebarCounts,
      setAddingSubtaskToId,
      setCollapsedTaskIds,
      setEditingTaskId,
      setOptimisticGroupTasks,
      setSelectedTaskGroupId,
    ],
  );

  const handleLoadPage = useCallback(async () => {
    setPageLoadError(null);
    setTaskView(localStorageTaskViewSource.findTaskView());
    try {
      const [loadedTaskGroups, loadedCategories] = await Promise.all([
        findTaskGroups(),
        findCategories(),
      ]);
      setTaskGroups(loadedTaskGroups);
      setCategories(loadedCategories);
      await openTaskGroup(pickStartingGroupId(loadedTaskGroups));
    } catch (pageError) {
      if (!(pageError instanceof AppError)) throw pageError;
      setPageLoadError(pageError);
    }
  }, [openTaskGroup, setCategories, setPageLoadError, setTaskGroups, setTaskView]);

  const handleSelectTaskGroup = useCallback(
    (taskGroupId: string) => {
      if (taskGroupId === selectedTaskGroupId) return;
      router.replace(`${TASKS_PATH}?${GROUP_QUERY_NAME}=${taskGroupId}`, { scroll: false });
      void openTaskGroup(taskGroupId);
    },
    [openTaskGroup, router, selectedTaskGroupId],
  );

  const applyAffectedGroups = useCallback(
    (affectedGroups: readonly AffectedGroup[]) =>
      setTaskGroups((currentTaskGroups) =>
        currentTaskGroups === null
          ? currentTaskGroups
          : currentTaskGroups.map((taskGroup) => {
              const affectedGroup = affectedGroups.find(
                (candidateGroup) => candidateGroup.id === taskGroup.id,
              );
              return affectedGroup === undefined
                ? taskGroup
                : {
                    ...taskGroup,
                    openTaskCount: affectedGroup.openTaskCount,
                    taskCount: affectedGroup.taskCount,
                  };
            }),
      ),
    [setTaskGroups],
  );

  const runTaskWrite = useCallback(
    async (localChange: LocalTaskChange, sendWrite: () => Promise<GroupTasks>) => {
      lastWriteIdRef.current += 1;
      const writeId = lastWriteIdRef.current;
      setOptimisticGroupTasks((currentState) =>
        currentState === null ? currentState : startWrite(currentState, writeId, localChange),
      );
      try {
        const answeredGroupTasks = await sendWrite();
        setOptimisticGroupTasks((currentState) =>
          currentState === null ||
          currentState.confirmedGroupTasks.group.id !== answeredGroupTasks.group.id
            ? currentState
            : confirmWrite(currentState, writeId, answeredGroupTasks),
        );
        refreshSidebarCounts(answeredGroupTasks);
      } catch (writeError) {
        setOptimisticGroupTasks((currentState) =>
          currentState === null ? currentState : failWrite(currentState, writeId),
        );
        reportAppError(writeError);
      }
    },
    [refreshSidebarCounts, setOptimisticGroupTasks],
  );

  const handleAddTask = useCallback(
    (enteredName: string, parentTaskId: string | null) => {
      if (selectedTaskGroupId === null || enteredName.trim() === '') return false;
      setAddingSubtaskToId(null);
      if (parentTaskId !== null) {
        setCollapsedTaskIds(
          (currentIds) => new Set([...currentIds].filter((taskId) => taskId !== parentTaskId)),
        );
      }
      void runTaskWrite(
        {
          kind: 'add',
          taskRecord: {
            id: `${PENDING_TASK_ID_PREFIX}${lastWriteIdRef.current + 1}`,
            parentId: parentTaskId,
            position: 0,
            name: enteredName.trim(),
            isDone: false,
            estimateMinutes: null,
          },
        },
        () => addTask({ taskGroupId: selectedTaskGroupId, taskName: enteredName, parentTaskId }),
      );
      return true;
    },
    [runTaskWrite, selectedTaskGroupId, setAddingSubtaskToId, setCollapsedTaskIds],
  );

  const handleSaveTaskEdit = useCallback(
    (taskId: string, enteredName: string, estimateText: string) => {
      try {
        const taskEdit = readTaskEdit(enteredName, estimateText);
        setEditingTaskId(null);
        void runTaskWrite(
          {
            kind: 'update',
            taskId,
            taskName: taskEdit.taskName,
            estimateMinutes: taskEdit.estimateMinutes,
          },
          () => updateTask({ taskId, taskName: enteredName, estimateText }),
        );
      } catch (editError) {
        reportAppError(editError);
      }
    },
    [runTaskWrite, setEditingTaskId],
  );

  const handleToggleTaskDone = useCallback(
    (taskId: string, isDone: boolean) => {
      if (taskId.startsWith(PENDING_TASK_ID_PREFIX)) return;
      void runTaskWrite({ kind: isDone ? 'complete' : 'reopen', taskId }, () =>
        setTaskDone({ taskId, isDone }),
      );
    },
    [runTaskWrite],
  );

  const handleRequestDeleteTask = useCallback(
    (taskId: string) => {
      hidePopover(TASK_ACTIONS_MENU_ID);
      setDeleteTargetTaskId(taskId);
      showPopover(DELETE_TASK_DIALOG_ID);
    },
    [setDeleteTargetTaskId],
  );

  const handleConfirmDeleteTask = useCallback(() => {
    if (deleteTargetTaskId === null) return;
    hidePopover(DELETE_TASK_DIALOG_ID);
    setDeleteTargetTaskId(null);
    void runTaskWrite({ kind: 'delete', taskId: deleteTargetTaskId }, () =>
      deleteTask(deleteTargetTaskId),
    );
  }, [deleteTargetTaskId, runTaskWrite, setDeleteTargetTaskId]);

  const handleToggleTaskExpanded = useCallback(
    (taskId: string) =>
      setCollapsedTaskIds((currentIds) => {
        const nextIds = new Set(currentIds);
        if (nextIds.has(taskId)) nextIds.delete(taskId);
        else nextIds.add(taskId);
        return nextIds;
      }),
    [setCollapsedTaskIds],
  );

  const handleChooseTaskView = useCallback(
    (chosenTaskView: TaskView) => {
      setTaskView(chosenTaskView);
      localStorageTaskViewSource.saveTaskView(chosenTaskView);
    },
    [setTaskView],
  );

  const handleStartEditingTask = useCallback(
    (taskId: string) => {
      setAddingSubtaskToId(null);
      setEditingTaskId(taskId);
    },
    [setAddingSubtaskToId, setEditingTaskId],
  );

  const handleStartAddingSubtask = useCallback(
    (taskId: string) => {
      setEditingTaskId(null);
      setAddingSubtaskToId(taskId);
      setCollapsedTaskIds(
        (currentIds) => new Set([...currentIds].filter((collapsedId) => collapsedId !== taskId)),
      );
    },
    [setAddingSubtaskToId, setCollapsedTaskIds, setEditingTaskId],
  );

  const handleCancelTaskEditor = useCallback(() => {
    setEditingTaskId(null);
    setAddingSubtaskToId(null);
  }, [setAddingSubtaskToId, setEditingTaskId]);

  const submitGroupDialog = useCallback(
    async (dialogId: string, saveGroup: () => Promise<void>) => {
      setSubmittingDialogId(dialogId);
      try {
        await saveGroup();
        hidePopover(dialogId);
      } catch (groupError) {
        reportAppError(groupError);
      } finally {
        setSubmittingDialogId(null);
      }
    },
    [setSubmittingDialogId],
  );

  const handleSubmitNewGroup = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const newGroupForm = submitEvent.currentTarget;
      await submitGroupDialog(NEW_GROUP_DIALOG_ID, async () => {
        const createdTaskGroup = await createTaskGroup(readGroupForm(newGroupForm));
        setTaskGroups((currentTaskGroups) => [createdTaskGroup, ...(currentTaskGroups ?? [])]);
        newGroupForm.reset();
        router.replace(`${TASKS_PATH}?${GROUP_QUERY_NAME}=${createdTaskGroup.id}`, {
          scroll: false,
        });
        await openTaskGroup(createdTaskGroup.id);
      });
    },
    [openTaskGroup, router, setTaskGroups, submitGroupDialog],
  );

  const handleSubmitGroupSettings = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      if (selectedTaskGroupId === null) return;
      const settingsForm = submitEvent.currentTarget;
      await submitGroupDialog(GROUP_SETTINGS_DIALOG_ID, async () => {
        const updatedTaskGroup = await updateTaskGroup({
          taskGroupId: selectedTaskGroupId,
          ...readGroupForm(settingsForm),
        });
        setTaskGroups((currentTaskGroups) =>
          (currentTaskGroups ?? []).map((taskGroup) =>
            taskGroup.id === updatedTaskGroup.id ? updatedTaskGroup : taskGroup,
          ),
        );
        setOptimisticGroupTasks((currentState) =>
          currentState === null
            ? currentState
            : {
                ...currentState,
                confirmedGroupTasks: {
                  ...currentState.confirmedGroupTasks,
                  group: {
                    id: updatedTaskGroup.id,
                    name: updatedTaskGroup.name,
                    category: updatedTaskGroup.category,
                  },
                },
              },
        );
      });
    },
    [selectedTaskGroupId, setOptimisticGroupTasks, setTaskGroups, submitGroupDialog],
  );

  const handleConfirmDeleteGroup = useCallback(async () => {
    if (selectedTaskGroupId === null) return;
    await submitGroupDialog(DELETE_GROUP_DIALOG_ID, async () => {
      await deleteTaskGroup(selectedTaskGroupId);
      hidePopover(GROUP_SETTINGS_DIALOG_ID);
      const remainingTaskGroups = (taskGroups ?? []).filter(
        (taskGroup) => taskGroup.id !== selectedTaskGroupId,
      );
      setTaskGroups(remainingTaskGroups);
      const nextTaskGroupId = remainingTaskGroups[0]?.id ?? null;
      router.replace(
        nextTaskGroupId === null
          ? TASKS_PATH
          : `${TASKS_PATH}?${GROUP_QUERY_NAME}=${nextTaskGroupId}`,
        { scroll: false },
      );
      await openTaskGroup(nextTaskGroupId);
    });
  }, [openTaskGroup, router, selectedTaskGroupId, setTaskGroups, submitGroupDialog, taskGroups]);

  const shownTaskRecords = useMemo(
    () => (optimisticGroupTasks === null ? [] : visibleGroupTasks(optimisticGroupTasks).tasks),
    [optimisticGroupTasks],
  );

  const sendMove = useCallback(
    (taskId: string, targetGroupId: string, parentTaskId: string | null, position: number) => {
      if (selectedTaskGroupId === null) return;
      const localChange: LocalTaskChange =
        targetGroupId === selectedTaskGroupId
          ? { kind: 'move', taskId, parentId: parentTaskId, position }
          : { kind: 'leave', taskId };
      void runTaskWrite(localChange, async () => {
        const movedGroupTasks: MovedGroupTasks = await moveTask({
          taskId,
          moveTarget: { groupId: targetGroupId, parentId: parentTaskId, position },
        });
        applyAffectedGroups(movedGroupTasks.affectedGroups);
        return movedGroupTasks;
      });
    },
    [applyAffectedGroups, runTaskWrite, selectedTaskGroupId],
  );

  const handleOpenTaskActions = useCallback(
    (taskId: string) => setActionsTargetTaskId(taskId),
    [setActionsTargetTaskId],
  );

  const handleMoveTaskBy = useCallback(
    (taskId: string, positionStep: number) => {
      hidePopover(TASK_ACTIONS_MENU_ID);
      const movingRecord = shownTaskRecords.find((taskRecord) => taskRecord.id === taskId);
      if (movingRecord === undefined || selectedTaskGroupId === null) return;
      const targetPosition = movingRecord.position + positionStep;
      const lastPosition = countSiblings(shownTaskRecords, movingRecord.parentId, taskId);
      if (targetPosition < 0 || targetPosition > lastPosition) return;
      sendMove(taskId, selectedTaskGroupId, movingRecord.parentId, targetPosition);
    },
    [selectedTaskGroupId, sendMove, shownTaskRecords],
  );

  const handleDropTask = useCallback(
    (draggedTaskId: string, targetTaskId: string) => {
      if (draggedTaskId === targetTaskId || selectedTaskGroupId === null) return;
      const targetRecord = shownTaskRecords.find((taskRecord) => taskRecord.id === targetTaskId);
      if (targetRecord === undefined) return;
      if (collectSubtreeIds(shownTaskRecords, draggedTaskId).has(targetTaskId)) return;
      sendMove(draggedTaskId, selectedTaskGroupId, targetRecord.parentId, targetRecord.position);
    },
    [selectedTaskGroupId, sendMove, shownTaskRecords],
  );

  const handleOpenMoveDialog = useCallback(
    (taskId: string) => {
      hidePopover(TASK_ACTIONS_MENU_ID);
      setMovingTaskId(taskId);
      setMoveDialogGroupId(selectedTaskGroupId);
      setMoveDialogRecords(shownTaskRecords);
      setMoveDialogTargets(buildMoveTargets(shownTaskRecords, taskId));
      showPopover(MOVE_TASK_DIALOG_ID);
    },
    [
      selectedTaskGroupId,
      setMoveDialogGroupId,
      setMoveDialogRecords,
      setMoveDialogTargets,
      setMovingTaskId,
      shownTaskRecords,
    ],
  );

  const handleChooseMoveGroup = useCallback(
    async (chosenTaskGroupId: string) => {
      setMoveDialogGroupId(chosenTaskGroupId);
      if (chosenTaskGroupId === selectedTaskGroupId) {
        setMoveDialogRecords(shownTaskRecords);
        setMoveDialogTargets(buildMoveTargets(shownTaskRecords, movingTaskId));
        return;
      }
      setMoveDialogRecords(null);
      setMoveDialogTargets(null);
      try {
        const chosenGroupTasks = await findGroupTasks(chosenTaskGroupId);
        setMoveDialogRecords(chosenGroupTasks.tasks);
        setMoveDialogTargets(buildMoveTargets(chosenGroupTasks.tasks, null));
      } catch (loadError) {
        reportAppError(loadError);
      }
    },
    [
      movingTaskId,
      selectedTaskGroupId,
      setMoveDialogGroupId,
      setMoveDialogRecords,
      setMoveDialogTargets,
      shownTaskRecords,
    ],
  );

  const handleSubmitMove = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      if (movingTaskId === null || moveDialogGroupId === null || moveDialogRecords === null) {
        return;
      }
      const chosenParentId = readFormText(new FormData(submitEvent.currentTarget), 'move-parent');
      const parentTaskId = chosenParentId === '' ? null : chosenParentId;
      hidePopover(MOVE_TASK_DIALOG_ID);
      sendMove(
        movingTaskId,
        moveDialogGroupId,
        parentTaskId,
        countSiblings(moveDialogRecords, parentTaskId, movingTaskId),
      );
      setMovingTaskId(null);
    },
    [moveDialogGroupId, moveDialogRecords, movingTaskId, sendMove, setMovingTaskId],
  );

  const handleChooseImportFile = useCallback(
    async (chosenFile: File | null) => {
      if (chosenFile === null) return;
      if (chosenFile.size > MAX_IMPORT_FILE_BYTES) {
        setGroupImportReading({
          kind: 'problem',
          problem: {
            fileName: chosenFile.name,
            message: 'The file is larger than 1 MB.',
            path: '',
          },
        });
        return;
      }
      setGroupImportReading(readGroupImport(chosenFile.name, await chosenFile.text()));
    },
    [setGroupImportReading],
  );

  const handleSubmitImport = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      if (groupImportReading?.kind !== 'ready') return;
      const importedFileName = groupImportReading.preview.fileName;
      setSubmittingDialogId(IMPORT_GROUP_DIALOG_ID);
      try {
        const importedGroupTasks = await importGroup(groupImportReading.importFile);
        const importedTaskGroup: TaskGroup = {
          ...importedGroupTasks.group,
          openTaskCount: importedGroupTasks.openCount,
          taskCount: importedGroupTasks.tasks.length,
        };
        setTaskGroups((currentTaskGroups) => [importedTaskGroup, ...(currentTaskGroups ?? [])]);
        router.replace(`${TASKS_PATH}?${GROUP_QUERY_NAME}=${importedTaskGroup.id}`, {
          scroll: false,
        });
        setSelectedTaskGroupId(importedTaskGroup.id);
        localStorageTaskViewSource.saveLastTaskGroupId(importedTaskGroup.id);
        setOptimisticGroupTasks(startOptimisticGroupTasks(importedGroupTasks));
        setCollapsedTaskIds(new Set());
        setGroupImportReading(null);
        hidePopover(IMPORT_GROUP_DIALOG_ID);
      } catch (importError) {
        if (
          importError instanceof ApiError &&
          (importError.status === 422 || importError.status === 413)
        ) {
          setGroupImportReading({
            kind: 'problem',
            problem: {
              fileName: importedFileName,
              message: importError.description,
              path: importError.errorPath ?? '',
            },
          });
        } else {
          reportAppError(importError);
        }
      } finally {
        setSubmittingDialogId(null);
      }
    },
    [
      groupImportReading,
      router,
      setCollapsedTaskIds,
      setGroupImportReading,
      setOptimisticGroupTasks,
      setSelectedTaskGroupId,
      setSubmittingDialogId,
      setTaskGroups,
    ],
  );

  return {
    handleOpenTaskActions,
    handleMoveTaskBy,
    handleDropTask,
    handleOpenMoveDialog,
    handleChooseMoveGroup,
    handleSubmitMove,
    handleChooseImportFile,
    handleSubmitImport,
    handleLoadPage,
    handleSelectTaskGroup,
    handleAddTask,
    handleSaveTaskEdit,
    handleToggleTaskDone,
    handleRequestDeleteTask,
    handleConfirmDeleteTask,
    handleToggleTaskExpanded,
    handleChooseTaskView,
    handleStartEditingTask,
    handleStartAddingSubtask,
    handleCancelTaskEditor,
    handleSubmitNewGroup,
    handleSubmitGroupSettings,
    handleConfirmDeleteGroup,
  };
};

export default useTasksEvents;
