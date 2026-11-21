import type { TaskDue, TaskPriority } from '@/features/tasks/entities/task-planning';

type UpNextTaskRecord = {
  taskId: string;
  name: string;
  groupId: string;
  groupName: string;
  estimateMinutes: number | null;
  due: TaskDue | null;
  priority: TaskPriority;
  plannedEvent: { id: string; startsAt: string; endsAt: string } | null;
  missed: boolean;
};

type UpNextRecord = {
  tasks: UpNextTaskRecord[];
  refreshAt: string;
};

type UpNextBlock = {
  eventId: string;
  startsAt: Date;
  endsAt: Date;
};

type UpNextTask = {
  taskId: string;
  name: string;
  groupId: string;
  groupName: string;
  estimateMinutes: number | null;
  due: TaskDue | null;
  priority: TaskPriority;
  plannedBlock: UpNextBlock | null;
  isMissed: boolean;
};

type UpNext = {
  tasks: UpNextTask[];
  refreshAt: Date;
};

const upNextFromRecord = (upNextRecord: UpNextRecord): UpNext => ({
  tasks: upNextRecord.tasks.map((taskRecord) => ({
    taskId: taskRecord.taskId,
    name: taskRecord.name,
    groupId: taskRecord.groupId,
    groupName: taskRecord.groupName,
    estimateMinutes: taskRecord.estimateMinutes,
    due: taskRecord.due,
    priority: taskRecord.priority,
    plannedBlock:
      taskRecord.plannedEvent === null
        ? null
        : {
            eventId: taskRecord.plannedEvent.id,
            startsAt: new Date(taskRecord.plannedEvent.startsAt),
            endsAt: new Date(taskRecord.plannedEvent.endsAt),
          },
    isMissed: taskRecord.missed,
  })),
  refreshAt: new Date(upNextRecord.refreshAt),
});

export type { UpNext, UpNextRecord, UpNextTaskRecord };
export { upNextFromRecord };
export default UpNextTask;
