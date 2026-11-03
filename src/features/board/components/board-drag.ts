import type { DragEvent } from 'react';

export const DRAGGED_CARD_DATA_TYPE = 'application/x-daibx-card';
export const DRAGGED_LIST_DATA_TYPE = 'application/x-daibx-list';

export const isDragCarrying = (dragEvent: DragEvent, dataType: string) =>
  dragEvent.dataTransfer.types.includes(dataType);

export const isLeavingElement = (dragEvent: DragEvent) =>
  !(dragEvent.relatedTarget instanceof Node) ||
  !dragEvent.currentTarget.contains(dragEvent.relatedTarget);
