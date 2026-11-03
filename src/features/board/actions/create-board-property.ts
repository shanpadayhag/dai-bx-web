import AppError from '@/core/app-error';
import backendBoardPropertySource, {
  type NewPropertyOption,
} from '@/features/board/data_sources/backend/board-property-source';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';

export type PropertyOptionDraft = {
  name: string;
  color: string | null;
};

export type NewPropertyEntry = {
  propertyName: string;
  kind: BoardPropertyKind;
  optionDrafts: readonly PropertyOptionDraft[];
};

type CreateBoardPropertyParams = NewPropertyEntry & {
  boardId: Board['id'];
};

export const readPropertyName = (propertyName: string): string => {
  const trimmedPropertyName = propertyName.trim();
  if (trimmedPropertyName === '') {
    throw new AppError('Name the property', 'Give it a name, like Project or Size.');
  }
  return trimmedPropertyName;
};

export const readOptionName = (optionName: string): string => {
  const trimmedOptionName = optionName.trim();
  if (trimmedOptionName === '') {
    throw new AppError('Name the option', 'An option needs a name, like DaiBX or Small.');
  }
  return trimmedOptionName;
};

const readNewOptions = (
  kind: BoardPropertyKind,
  optionDrafts: readonly PropertyOptionDraft[],
): NewPropertyOption[] | undefined => {
  if (kind !== BoardPropertyKind.Choice) return undefined;
  const namedOptions = optionDrafts.flatMap((optionDraft) =>
    optionDraft.name.trim() === ''
      ? []
      : [
          optionDraft.color === null
            ? { name: optionDraft.name.trim() }
            : { name: optionDraft.name.trim(), color: optionDraft.color },
        ],
  );
  if (namedOptions.length === 0) {
    throw new AppError('Add an option', 'A choice property needs at least one option.');
  }
  return namedOptions;
};

const createBoardProperty = (params: CreateBoardPropertyParams): Promise<BoardRecord> => {
  const propertyName = readPropertyName(params.propertyName);
  const newOptions = readNewOptions(params.kind, params.optionDrafts);
  return backendBoardPropertySource.create(params.boardId, {
    name: propertyName,
    kind: params.kind,
    ...(newOptions === undefined ? {} : { options: newOptions }),
  });
};

export default createBoardProperty;
