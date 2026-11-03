export type ExportedValue = {
  property: string;
  value: string;
};

export type ExportedCard = {
  id: string;
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  values: ExportedValue[];
  notes: string;
};

type ListExport = {
  board: { name: string };
  list: { name: string };
  cards: ExportedCard[];
};

export default ListExport;
