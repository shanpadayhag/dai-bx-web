type TaskRecord = {
  id: string;
  parentId: string | null;
  position: number;
  name: string;
  isDone: boolean;
  estimateMinutes: number | null;
};

export default TaskRecord;
