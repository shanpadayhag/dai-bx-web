export interface Group {
  id: string;
  name: string;
  order: number;
  isOpen: boolean;
  isHidden: boolean;
}

export type GroupRow = Group;
