type TaskSession = {
  id: string;
  taskName: string;
  groupName: string;
  startedAt: string;
  elapsed: string;
  estimate: string;
  lastCheckInAt: string;
  missedCheckInAt: string | null;
  currentTime: string;
};

export default TaskSession;
