export interface Task {
  id: string;
  name: string;
  order: number;
  hiddenUntil: string | null;
  completedDate: string | null;
  isOpen: boolean;
  tasks: Task[];
}

export interface Group {
  id: string;
  name: string;
  isOpen: boolean;
  tasks: Task[];
}
