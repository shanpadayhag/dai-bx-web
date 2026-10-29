type Task = {
  id: string;
  parentId: string | null;
  position: number;
  name: string;
  isDone: boolean;
  isOpen: boolean;
  isTracking: boolean;
  estimateMinutes: number | null;
  tasks: Task[];
};

export default Task;
