import type BoardPropertyKind from '@/features/board/enums/board-property-kind';
import type PropertyOption from '@/features/board/entities/property-option';

type BoardProperty = {
  id: string;
  name: string;
  kind: BoardPropertyKind;
  options: PropertyOption[];
};

export default BoardProperty;
