type Task = {
  id: string;
  name: string;
  isDone: boolean;
  isOpen: boolean;
  isTracking: boolean;
  estimate: string | null;
  tasks: Task[];
};

export default Task;
