type RenameEventsAnswer = 'rename-all' | 'keep-old-names' | 'cancel';

type RenameEventsRequest = {
  eventCount: number;
  previousName: string;
  nextName: string;
};

const trackedEventCountOf = (trackedEventCount: number, isRunning: boolean): number =>
  isRunning ? Math.max(trackedEventCount, 1) : trackedEventCount;

export type { RenameEventsAnswer, RenameEventsRequest };
export { trackedEventCountOf };
