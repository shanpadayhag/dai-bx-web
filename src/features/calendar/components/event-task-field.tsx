import { useEffect, useState } from 'react';
import Select from '@/core/components/atoms/select';
import Field from '@/core/components/molecules/field';
import type { LinkedTask } from '@/features/calendar/entities/calendar-event';
import { linkableTaskChoices, type TaskChoice } from '@/features/calendar/entities/task-choice';

type TaskGroupChoice = {
  id: string;
  name: string;
};

type EventTaskFieldProps = {
  idPrefix: string;
  linkedTask: LinkedTask | null;
  taskGroups: readonly TaskGroupChoice[] | null;
  taskChoicesByGroupId: Readonly<Record<string, readonly TaskChoice[]>>;
  onLoadGroupTasks: (groupId: string) => void;
};

const EventTaskField = ({
  idPrefix,
  linkedTask,
  taskGroups,
  taskChoicesByGroupId,
  onLoadGroupTasks,
}: EventTaskFieldProps) => {
  const [chosenGroupId, setChosenGroupId] = useState(linkedTask?.groupId ?? '');
  const groupTaskChoices =
    chosenGroupId === '' ? null : (taskChoicesByGroupId[chosenGroupId] ?? null);
  const taskChoices =
    groupTaskChoices === null
      ? null
      : linkableTaskChoices(groupTaskChoices, linkedTask?.id ?? null);

  useEffect(() => {
    if (chosenGroupId !== '' && groupTaskChoices === null) onLoadGroupTasks(chosenGroupId);
  }, [chosenGroupId, groupTaskChoices, onLoadGroupTasks]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <Field label="Task group" htmlFor={`${idPrefix}-group`}>
        <Select
          id={`${idPrefix}-group`}
          value={chosenGroupId}
          disabled={taskGroups === null}
          onChange={(changeEvent) => setChosenGroupId(changeEvent.currentTarget.value)}
        >
          <option value="">No task</option>
          {(taskGroups ?? []).map((taskGroup) => (
            <option key={taskGroup.id} value={taskGroup.id}>
              {taskGroup.name}
            </option>
          ))}
          {linkedTask !== null &&
          taskGroups !== null &&
          !taskGroups.some((taskGroup) => taskGroup.id === linkedTask.groupId) ? (
            <option value={linkedTask.groupId}>{linkedTask.groupName}</option>
          ) : null}
        </Select>
      </Field>
      {chosenGroupId === '' ? (
        <input type="hidden" name="taskId" value="" />
      ) : (
        <Field label="Task" htmlFor={`${idPrefix}-task`}>
          <Select
            key={`${chosenGroupId}-${taskChoices === null ? 'loading' : 'ready'}`}
            id={`${idPrefix}-task`}
            name="taskId"
            disabled={taskChoices === null}
            defaultValue={
              linkedTask !== null && linkedTask.groupId === chosenGroupId
                ? linkedTask.id
                : undefined
            }
          >
            {taskChoices === null ? (
              <option value={linkedTask?.groupId === chosenGroupId ? linkedTask.id : ''}>
                Loading tasks…
              </option>
            ) : taskChoices.length === 0 ? (
              <option value="">No open tasks here</option>
            ) : (
              taskChoices.map((taskChoice) => (
                <option key={taskChoice.id} value={taskChoice.id}>
                  {taskChoice.name}
                </option>
              ))
            )}
          </Select>
        </Field>
      )}
    </div>
  );
};

export type { TaskGroupChoice };
export default EventTaskField;
