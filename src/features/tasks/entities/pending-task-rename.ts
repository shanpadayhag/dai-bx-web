import type { RenameEventsRequest } from '@/core/rename-events';

type PendingTaskRename = {
  taskId: string;
  enteredName: string;
  estimateText: string;
  renameRequest: RenameEventsRequest;
};

export default PendingTaskRename;
