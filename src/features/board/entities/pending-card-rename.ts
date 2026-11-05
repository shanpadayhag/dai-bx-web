import type { RenameEventsRequest } from '@/core/rename-events';

type PendingCardRename = {
  cardId: string;
  cardTitle: string;
  renameRequest: RenameEventsRequest;
};

export default PendingCardRename;
