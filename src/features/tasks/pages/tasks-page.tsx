'use client';

import { Plus, RotateCw, Settings2, WifiOff } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import Button from '@/core/components/atoms/button';
import CategoryChip from '@/core/components/atoms/category-chip';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import EmptyState from '@/core/components/molecules/empty-state';
import PageHeader from '@/core/components/molecules/page-header';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import DeleteGroupDialog from '@/features/tasks/components/delete-group-dialog';
import DeleteTaskDialog from '@/features/tasks/components/delete-task-dialog';
import EmptyGroupState from '@/features/tasks/components/empty-group-state';
import GroupFormDialog from '@/features/tasks/components/group-form-dialog';
import ImportGroupDialog from '@/features/tasks/components/import-group-dialog';
import MoveTaskDialog from '@/features/tasks/components/move-task-dialog';
import NoGroupsState from '@/features/tasks/components/no-groups-state';
import TaskActionsMenu from '@/features/tasks/components/task-actions-menu';
import TaskGroupList from '@/features/tasks/components/task-group-list';
import TaskTree from '@/features/tasks/components/task-tree';
import { visibleGroupTasks } from '@/features/tasks/entities/optimistic-group-tasks';
import { collectSubtreeIds } from '@/features/tasks/entities/task-record-changes';
import { buildTaskTree } from '@/features/tasks/entities/task-tree';
import useTasksEvents, {
  DELETE_GROUP_DIALOG_ID,
  DELETE_TASK_DIALOG_ID,
  GROUP_SETTINGS_DIALOG_ID,
  IMPORT_GROUP_DIALOG_ID,
  MOVE_TASK_DIALOG_ID,
  NEW_GROUP_DIALOG_ID,
  TASK_ACTIONS_MENU_ID,
} from '@/features/tasks/events/use-tasks-events';
import useTasksStates from '@/features/tasks/states/use-tasks-states';

const TASK_VIEW_LABELS = { open: 'Open', all: 'All' } as const;
const NEW_TASK_INPUT_ID = 'new-task-name';

const TasksPage = () => {
  const states = useTasksStates();
  const events = useTasksEvents(states);
  const { handleLoadPage } = events;

  useEffect(() => {
    void handleLoadPage();
  }, [handleLoadPage]);

  const shownGroupTasks = useMemo(
    () =>
      states.optimisticGroupTasks === null ? null : visibleGroupTasks(states.optimisticGroupTasks),
    [states.optimisticGroupTasks],
  );
  const taskTree = useMemo(() => {
    if (shownGroupTasks === null) return [];
    const shownRecords =
      states.taskView === 'open'
        ? shownGroupTasks.tasks.filter((taskRecord) => !taskRecord.isDone)
        : shownGroupTasks.tasks;
    return buildTaskTree(shownRecords, states.collapsedTaskIds);
  }, [shownGroupTasks, states.collapsedTaskIds, states.taskView]);

  const selectedTaskGroup =
    states.taskGroups?.find((taskGroup) => taskGroup.id === states.selectedTaskGroupId) ?? null;
  const deleteTargetRecord =
    shownGroupTasks?.tasks.find((taskRecord) => taskRecord.id === states.deleteTargetTaskId) ??
    null;
  const deleteTargetSubtaskCount =
    deleteTargetRecord === null || shownGroupTasks === null
      ? 0
      : collectSubtreeIds(shownGroupTasks.tasks, deleteTargetRecord.id).size - 1;

  const newGroupDialog = (
    <GroupFormDialog
      dialogId={NEW_GROUP_DIALOG_ID}
      title="New group"
      description="A list of tasks, like a project or a day."
      submitLabel="Create group"
      initialName=""
      initialCategoryId={null}
      categories={states.categories}
      isSubmitting={states.submittingDialogId === NEW_GROUP_DIALOG_ID}
      onSubmit={(submitEvent) => void events.handleSubmitNewGroup(submitEvent)}
    />
  );
  const importGroupDialog = (
    <ImportGroupDialog
      id={IMPORT_GROUP_DIALOG_ID}
      groupImportReading={states.groupImportReading}
      isSubmitting={states.submittingDialogId === IMPORT_GROUP_DIALOG_ID}
      onChooseFile={(chosenFile) => void events.handleChooseImportFile(chosenFile)}
      onSubmit={(submitEvent) => void events.handleSubmitImport(submitEvent)}
    />
  );
  const actionsTargetRecord =
    shownGroupTasks?.tasks.find((taskRecord) => taskRecord.id === states.actionsTargetTaskId) ??
    null;
  const actionsTargetSiblingCount =
    actionsTargetRecord === null || shownGroupTasks === null
      ? 0
      : shownGroupTasks.tasks.filter(
          (taskRecord) => taskRecord.parentId === actionsTargetRecord.parentId,
        ).length;
  const movingRecord =
    shownGroupTasks?.tasks.find((taskRecord) => taskRecord.id === states.movingTaskId) ?? null;

  if (states.taskGroups === null) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        {states.pageLoadError === null ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading your tasks…
          </p>
        ) : (
          <EmptyState
            icon={<WifiOff />}
            title={states.pageLoadError.title}
            description={states.pageLoadError.description}
            action={
              <Button variant="secondary" onClick={() => void handleLoadPage()}>
                <RotateCw />
                Try again
              </Button>
            }
          />
        )}
      </div>
    );
  }

  if (states.taskGroups.length === 0) {
    return (
      <div className="mx-auto grid max-w-3xl gap-6">
        <PageHeader
          title="Tasks"
          description="Groups hold your tasks, nested as deep as you need."
        />
        <NoGroupsState newGroupDialogId={NEW_GROUP_DIALOG_ID} />
        {newGroupDialog}
        {importGroupDialog}
      </div>
    );
  }

  const shownGroup = shownGroupTasks?.group ?? selectedTaskGroup;
  const shownGroupName = shownGroup?.name ?? 'Tasks';

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <TaskGroupList
        taskGroups={states.taskGroups}
        selectedTaskGroupId={states.selectedTaskGroupId}
        newGroupDialogId={NEW_GROUP_DIALOG_ID}
        onSelectTaskGroup={events.handleSelectTaskGroup}
      />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
        <PageHeader
          title={shownGroupName}
          titleAddon={
            <span className="flex items-center gap-1">
              {shownGroup?.category ? <CategoryChip category={shownGroup.category} /> : null}
              <IconButton label="Group settings" popoverTarget={GROUP_SETTINGS_DIALOG_ID}>
                <Settings2 />
              </IconButton>
            </span>
          }
          description={
            shownGroupTasks === null
              ? undefined
              : `${shownGroupTasks.openCount} open · ${shownGroupTasks.doneCount} done`
          }
          actions={
            <>
              <SegmentedControl
                label="Which tasks to show"
                options={[TASK_VIEW_LABELS.open, TASK_VIEW_LABELS.all]}
                selectedOption={TASK_VIEW_LABELS[states.taskView]}
                onSelectOption={(chosenLabel) =>
                  events.handleChooseTaskView(
                    chosenLabel === TASK_VIEW_LABELS.open ? 'open' : 'all',
                  )
                }
              />
              <Button onClick={() => document.getElementById(NEW_TASK_INPUT_ID)?.focus()}>
                <Plus />
                New task
              </Button>
            </>
          }
        />
        <section className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-background p-2 shadow-soft sm:p-3">
          <form
            className="flex items-center gap-2 border-b border-border px-3 pb-2"
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              const newTaskForm = submitEvent.currentTarget;
              const enteredName = new FormData(newTaskForm).get('taskName');
              if (typeof enteredName === 'string' && events.handleAddTask(enteredName, null)) {
                newTaskForm.reset();
              }
            }}
          >
            <Plus className="size-4 text-primary" />
            <Input
              id={NEW_TASK_INPUT_ID}
              name="taskName"
              maxLength={500}
              placeholder={`Add a task to ${shownGroupName}`}
              aria-label={`Add a task to ${shownGroupName}`}
              className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </form>
          {shownGroupTasks === null ? (
            <p role="status" className="px-3 py-6 text-sm text-muted-foreground">
              Loading tasks…
            </p>
          ) : shownGroupTasks.tasks.length === 0 && selectedTaskGroup !== null ? (
            <EmptyGroupState taskGroup={selectedTaskGroup} />
          ) : (
            <TaskTree
              tasks={taskTree}
              editingTaskId={states.editingTaskId}
              addingSubtaskToId={states.addingSubtaskToId}
              onSaveTaskEdit={events.handleSaveTaskEdit}
              onAddSubtask={(enteredName, parentTaskId) => {
                events.handleAddTask(enteredName, parentTaskId);
              }}
              onCancelTaskEditor={events.handleCancelTaskEditor}
              onToggleTaskDone={events.handleToggleTaskDone}
              onToggleTaskExpanded={events.handleToggleTaskExpanded}
              onStartAddingSubtask={events.handleStartAddingSubtask}
              onStartEditingTask={events.handleStartEditingTask}
              onRequestDeleteTask={events.handleRequestDeleteTask}
              onOpenTaskActions={events.handleOpenTaskActions}
              onDropTask={events.handleDropTask}
            />
          )}
        </section>
      </div>
      <DeleteTaskDialog
        dialogId={DELETE_TASK_DIALOG_ID}
        taskName={deleteTargetRecord?.name ?? null}
        subtaskCount={deleteTargetSubtaskCount}
        onConfirm={events.handleConfirmDeleteTask}
      />
      <TaskActionsMenu
        menuId={TASK_ACTIONS_MENU_ID}
        isFirstInList={actionsTargetRecord === null || actionsTargetRecord.position === 0}
        isLastInList={
          actionsTargetRecord === null ||
          actionsTargetRecord.position >= actionsTargetSiblingCount - 1
        }
        onAddSubtask={() => {
          if (actionsTargetRecord !== null) {
            events.handleStartAddingSubtask(actionsTargetRecord.id);
          }
        }}
        onRename={() => {
          if (actionsTargetRecord !== null) events.handleStartEditingTask(actionsTargetRecord.id);
        }}
        onMoveUp={() => {
          if (actionsTargetRecord !== null) events.handleMoveTaskBy(actionsTargetRecord.id, -1);
        }}
        onMoveDown={() => {
          if (actionsTargetRecord !== null) events.handleMoveTaskBy(actionsTargetRecord.id, 1);
        }}
        onMoveTo={() => {
          if (actionsTargetRecord !== null) events.handleOpenMoveDialog(actionsTargetRecord.id);
        }}
        onDelete={() => {
          if (actionsTargetRecord !== null) events.handleRequestDeleteTask(actionsTargetRecord.id);
        }}
      />
      <MoveTaskDialog
        dialogId={MOVE_TASK_DIALOG_ID}
        taskName={movingRecord?.name ?? 'this task'}
        subtaskCount={
          movingRecord === null || shownGroupTasks === null
            ? 0
            : collectSubtreeIds(shownGroupTasks.tasks, movingRecord.id).size - 1
        }
        taskGroups={states.taskGroups}
        chosenTaskGroupId={states.moveDialogGroupId}
        moveTargets={states.moveDialogTargets}
        onChooseTaskGroup={(taskGroupId) => void events.handleChooseMoveGroup(taskGroupId)}
        onSubmit={events.handleSubmitMove}
      />
      {newGroupDialog}
      {importGroupDialog}
      <GroupFormDialog
        key={`${selectedTaskGroup?.id ?? 'none'}-${selectedTaskGroup?.name ?? ''}-${selectedTaskGroup?.category?.id ?? ''}`}
        dialogId={GROUP_SETTINGS_DIALOG_ID}
        title="Group settings"
        description="Rename the group or give it a category color."
        submitLabel="Save"
        initialName={selectedTaskGroup?.name ?? ''}
        initialCategoryId={selectedTaskGroup?.category?.id ?? null}
        categories={states.categories}
        isSubmitting={states.submittingDialogId === GROUP_SETTINGS_DIALOG_ID}
        deleteDialogId={DELETE_GROUP_DIALOG_ID}
        onSubmit={(submitEvent) => void events.handleSubmitGroupSettings(submitEvent)}
      />
      <DeleteGroupDialog
        dialogId={DELETE_GROUP_DIALOG_ID}
        taskGroup={selectedTaskGroup}
        isSubmitting={states.submittingDialogId === DELETE_GROUP_DIALOG_ID}
        onConfirm={() => void events.handleConfirmDeleteGroup()}
      />
    </div>
  );
};

export default TasksPage;
