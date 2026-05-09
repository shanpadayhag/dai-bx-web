export interface Task {
  id: string;
  name: string;
  order: number;
  hiddenUntil: string | null;
  completedDate: string | null;
  isOpen: boolean;
  tasks: Task[];
}

export interface TaskRow {
  id: string;
  groupId: string;
  parentId: string | null;
  name: string;
  order: number;
  hiddenUntil: string | null;
  completedDate: string | null;
  isOpen: boolean;
}
