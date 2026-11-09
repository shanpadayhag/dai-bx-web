'use client';

import { MoveRight } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import joinClassNames from '@/core/class-names';
import CalendarEventBlock from '@/features/calendar/components/calendar-event-block';
import CalendarScrollArea from '@/features/calendar/components/calendar-scroll-area';
import CalendarStackBlock from '@/features/calendar/components/calendar-stack-block';
import {
  draftTimes,
  movedTimes,
  resizedEnd,
  type EventTimes,
} from '@/features/calendar/entities/calendar-drag';
import type { CalendarDay } from '@/features/calendar/entities/calendar-days';
import { calendarDateTitle, partsInZone } from '@/core/zoned-time';
import { MINUTES_PER_DAY, type EventPiece } from '@/features/calendar/entities/day-layout';
import { formatClock, formatMinuteOfDay } from '@/features/calendar/entities/event-time';
import type ScheduledMove from '@/features/calendar/entities/scheduled-move';

const HOUR_HEIGHT = 56;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const HOUR_MINUTES = Array.from({ length: 24 }, (_, hourIndex) => hourIndex * 60);
const DRAG_THRESHOLD_PIXELS = 4;

type BlockDragKind = 'move' | 'resize';

type DragGesture = {
  kind: 'create' | BlockDragKind;
  startX: number;
  startY: number;
  isDragging: boolean;
  dayIndex: number;
  anchorMinute: number;
  eventId: string | null;
  eventTimes: EventTimes | null;
};

type DragGhost = {
  dayIndex: number;
  startMinute: number;
  endMinute: number;
  eventTimes: EventTimes;
};

type CalendarGridProps = {
  gridDays: CalendarDay[];
  scheduledMoves: readonly ScheduledMove[];
  timeZone: string;
  now: Date;
  workingHoursStartMinute: number;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onDraftEvent: (eventTimes: EventTimes) => void;
  onRetimeEvent: (eventId: string, eventTimes: EventTimes) => void;
};

const isDraggingPointer = (pointerEvent: PointerEvent) =>
  pointerEvent.button === 0 &&
  (pointerEvent.pointerType === 'mouse' || pointerEvent.pointerType === 'pen');

const capturePointer = (pointerEvent: PointerEvent<HTMLElement>) => {
  if (typeof pointerEvent.currentTarget.setPointerCapture === 'function') {
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  }
};

const CalendarGrid = ({
  gridDays,
  scheduledMoves,
  timeZone,
  now,
  workingHoursStartMinute,
  selectedEventId,
  onSelectEvent,
  onDraftEvent,
  onRetimeEvent,
}: CalendarGridProps) => {
  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragGestureRef = useRef<DragGesture | null>(null);
  const suppressedClickRef = useRef(false);
  const [dragGhost, setDragGhost] = useState<DragGhost | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const isDayView = gridDays.length === 1;
  const wallClockMinute = (moment: Date): number => partsInZone(moment, timeZone).minuteOfDay;
  const calendarDateOf = (moment: Date): string => partsInZone(moment, timeZone).calendarDate;
  const clockText = (moment: Date): string => formatClock(moment, timeZone);
  const nowMinute = wallClockMinute(now);
  const gridColumnsStyle: CSSProperties = {
    gridTemplateColumns: `56px repeat(${gridDays.length}, minmax(0, 1fr))`,
  };

  const pointerPlace = (clientX: number, clientY: number) => {
    const columnRects = dayColumnRefs.current.map((dayColumn) =>
      dayColumn === null ? null : dayColumn.getBoundingClientRect(),
    );
    const pointedIndex = columnRects.findIndex(
      (columnRect) =>
        columnRect !== null && clientX >= columnRect.left && clientX < columnRect.right,
    );
    const firstRect = columnRects[0];
    const dayIndex =
      pointedIndex >= 0
        ? pointedIndex
        : firstRect !== null && firstRect !== undefined && clientX < firstRect.left
          ? 0
          : gridDays.length - 1;
    const columnTop = columnRects[dayIndex]?.top ?? 0;
    return { dayIndex, minute: (clientY - columnTop) / MINUTE_HEIGHT };
  };

  const dayIndexOf = (moment: Date) => {
    const momentDate = calendarDateOf(moment);
    return gridDays.findIndex((gridDay) => gridDay.calendarDate === momentDate);
  };

  const ghostFor = (
    dragGesture: DragGesture,
    clientX: number,
    clientY: number,
  ): DragGhost | null => {
    const { dayIndex, minute } = pointerPlace(clientX, clientY);
    const anchorDay = gridDays[dragGesture.dayIndex];
    const pointedDay = gridDays[dayIndex];
    if (anchorDay === undefined || pointedDay === undefined) return null;
    if (dragGesture.kind === 'create') {
      const eventTimes = draftTimes(
        anchorDay.calendarDate,
        dragGesture.anchorMinute,
        minute,
        timeZone,
      );
      return {
        dayIndex: dragGesture.dayIndex,
        startMinute: wallClockMinute(eventTimes.startsAt),
        endMinute: Math.min(
          MINUTES_PER_DAY,
          wallClockMinute(eventTimes.startsAt) +
            (eventTimes.endsAt.getTime() - eventTimes.startsAt.getTime()) / 60_000,
        ),
        eventTimes,
      };
    }
    if (dragGesture.eventTimes === null) return null;
    if (dragGesture.kind === 'move') {
      const eventTimes = movedTimes(
        dragGesture.eventTimes,
        minute - dragGesture.anchorMinute,
        dayIndex - dragGesture.dayIndex,
        timeZone,
      );
      const startMinute = wallClockMinute(eventTimes.startsAt);
      const durationMinutes =
        (eventTimes.endsAt.getTime() - eventTimes.startsAt.getTime()) / 60_000;
      const startDayIndex = dayIndexOf(eventTimes.startsAt);
      return {
        dayIndex: startDayIndex >= 0 ? startDayIndex : dayIndex,
        startMinute,
        endMinute: Math.min(MINUTES_PER_DAY, startMinute + durationMinutes),
        eventTimes,
      };
    }
    const endsAt = resizedEnd(
      dragGesture.eventTimes.startsAt,
      pointedDay.calendarDate,
      minute,
      timeZone,
    );
    const endDayIndex = dayIndexOf(endsAt);
    const ghostDayIndex = endDayIndex >= 0 ? endDayIndex : dayIndex;
    const ghostDay = gridDays[ghostDayIndex];
    const startsOnGhostDay =
      ghostDay !== undefined &&
      calendarDateOf(dragGesture.eventTimes.startsAt) === ghostDay.calendarDate;
    const endMinute = wallClockMinute(endsAt);
    return {
      dayIndex: ghostDayIndex,
      startMinute: startsOnGhostDay ? wallClockMinute(dragGesture.eventTimes.startsAt) : 0,
      endMinute: endMinute === 0 ? MINUTES_PER_DAY : endMinute,
      eventTimes: { startsAt: dragGesture.eventTimes.startsAt, endsAt },
    };
  };

  const handleColumnPointerDown = (
    dayIndex: number,
    pointerEvent: PointerEvent<HTMLDivElement>,
  ) => {
    if (!isDraggingPointer(pointerEvent) || pointerEvent.target !== pointerEvent.currentTarget) {
      return;
    }
    capturePointer(pointerEvent);
    dragGestureRef.current = {
      kind: 'create',
      startX: pointerEvent.clientX,
      startY: pointerEvent.clientY,
      isDragging: false,
      dayIndex,
      anchorMinute: pointerPlace(pointerEvent.clientX, pointerEvent.clientY).minute,
      eventId: null,
      eventTimes: null,
    };
  };

  const handleBlockPointerDown = (
    blockDragKind: BlockDragKind,
    piece: EventPiece,
    pointerEvent: PointerEvent<HTMLElement>,
  ) => {
    if (
      !isDraggingPointer(pointerEvent) ||
      piece.event.kind !== 'planned' ||
      piece.event.endsAt === null
    ) {
      return;
    }
    pointerEvent.stopPropagation();
    capturePointer(pointerEvent);
    const { dayIndex, minute } = pointerPlace(pointerEvent.clientX, pointerEvent.clientY);
    dragGestureRef.current = {
      kind: blockDragKind,
      startX: pointerEvent.clientX,
      startY: pointerEvent.clientY,
      isDragging: false,
      dayIndex,
      anchorMinute: minute,
      eventId: piece.event.id,
      eventTimes: { startsAt: piece.event.startsAt, endsAt: piece.event.endsAt },
    };
  };

  const handlePointerMove = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    const dragGesture = dragGestureRef.current;
    if (dragGesture === null) return;
    if (!dragGesture.isDragging) {
      const movedPixels = Math.hypot(
        pointerEvent.clientX - dragGesture.startX,
        pointerEvent.clientY - dragGesture.startY,
      );
      if (movedPixels < DRAG_THRESHOLD_PIXELS) return;
      dragGesture.isDragging = true;
      setDraggedEventId(dragGesture.eventId);
    }
    setDragGhost(ghostFor(dragGesture, pointerEvent.clientX, pointerEvent.clientY));
  };

  const endDrag = () => {
    dragGestureRef.current = null;
    setDragGhost(null);
    setDraggedEventId(null);
  };

  const handlePointerUp = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    const dragGesture = dragGestureRef.current;
    if (dragGesture === null) return;
    const finalGhost = dragGesture.isDragging
      ? ghostFor(dragGesture, pointerEvent.clientX, pointerEvent.clientY)
      : null;
    endDrag();
    if (dragGesture.kind === 'create') {
      const anchorDay = gridDays[dragGesture.dayIndex];
      if (anchorDay === undefined) return;
      onDraftEvent(
        finalGhost?.eventTimes ??
          draftTimes(
            anchorDay.calendarDate,
            dragGesture.anchorMinute,
            dragGesture.anchorMinute,
            timeZone,
          ),
      );
      return;
    }
    if (finalGhost === null || dragGesture.eventId === null) return;
    suppressedClickRef.current = true;
    onRetimeEvent(dragGesture.eventId, finalGhost.eventTimes);
  };

  const handleSelectEvent = (eventId: string) => {
    if (suppressedClickRef.current) {
      suppressedClickRef.current = false;
      return;
    }
    onSelectEvent(eventId);
  };

  return (
    <CalendarScrollArea
      initialScrollTop={Math.max(0, (workingHoursStartMinute - 30) * MINUTE_HEIGHT)}
    >
      <div className={isDayView ? undefined : 'min-w-[760px]'}>
        <div
          className="sticky top-0 z-10 grid border-b border-border bg-background/95 backdrop-blur"
          style={gridColumnsStyle}
        >
          <span />
          {gridDays.map((gridDay) => (
            <div
              key={gridDay.calendarDate}
              className={joinClassNames(
                'flex items-baseline gap-1.5 py-3',
                isDayView ? 'justify-start pl-3' : 'justify-center',
              )}
            >
              <span className="text-xs text-muted-foreground">
                {calendarDateTitle(gridDay.calendarDate, { weekday: 'short' }, 'en')}
              </span>
              <span
                className={joinClassNames(
                  'inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                  gridDay.isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}
              >
                {Number(gridDay.calendarDate.slice(8))}
              </span>
            </div>
          ))}
        </div>
        <div
          className="grid pt-3 pb-3 [--cascade-step:16px] data-[view=day]:[--cascade-step:28px]"
          data-view={isDayView ? 'day' : 'week'}
          style={gridColumnsStyle}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={endDrag}
        >
          <div>
            {HOUR_MINUTES.map((hourMinute) => (
              <div key={hourMinute} className="relative" style={{ height: HOUR_HEIGHT }}>
                {hourMinute === 0 ? null : (
                  <span className="absolute -top-2 right-2 font-mono text-[11px] text-muted-foreground tabular-nums">
                    {formatMinuteOfDay(hourMinute)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {gridDays.map((gridDay, dayIndex) => (
            <div
              key={gridDay.calendarDate}
              ref={(dayColumn) => {
                dayColumnRefs.current[dayIndex] = dayColumn;
              }}
              onPointerDown={(pointerEvent) => handleColumnPointerDown(dayIndex, pointerEvent)}
              className={joinClassNames(
                'relative border-l border-border select-none',
                gridDay.isToday && 'bg-primary-soft/25',
              )}
              style={{
                height: 24 * HOUR_HEIGHT,
                backgroundImage: 'linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
                backgroundSize: `100% ${HOUR_HEIGHT}px`,
              }}
            >
              {gridDay.layoutEntries.map((layoutEntry) =>
                layoutEntry.kind === 'stack' ? (
                  <CalendarStackBlock
                    key={layoutEntry.id}
                    stackEntry={layoutEntry}
                    minuteHeight={MINUTE_HEIGHT}
                    selectedEventId={selectedEventId}
                    timeZone={timeZone}
                    onSelectEvent={onSelectEvent}
                  />
                ) : (
                  <CalendarEventBlock
                    key={`${layoutEntry.piece.event.id}-${layoutEntry.piece.calendarDate}`}
                    piece={layoutEntry.piece}
                    cascadeLevel={layoutEntry.cascadeLevel}
                    minuteHeight={MINUTE_HEIGHT}
                    isSelected={layoutEntry.piece.event.id === selectedEventId}
                    isDragged={layoutEntry.piece.event.id === draggedEventId}
                    timeZone={timeZone}
                    onSelect={handleSelectEvent}
                    onStartDrag={handleBlockPointerDown}
                  />
                ),
              )}
              {dragGhost !== null && dragGhost.dayIndex === dayIndex ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-1 z-[4] rounded-lg border-2 border-dashed border-primary bg-primary-soft/70 px-2 py-1 font-mono text-[11px] text-primary-soft-foreground tabular-nums"
                  style={{
                    top: dragGhost.startMinute * MINUTE_HEIGHT,
                    height: Math.max(
                      (dragGhost.endMinute - dragGhost.startMinute) * MINUTE_HEIGHT,
                      14,
                    ),
                  }}
                >
                  {clockText(dragGhost.eventTimes.startsAt)} –{' '}
                  {clockText(dragGhost.eventTimes.endsAt)}
                </div>
              ) : null}
              {scheduledMoves
                .filter(
                  (scheduledMove) => calendarDateOf(scheduledMove.at) === gridDay.calendarDate,
                )
                .map((scheduledMove) => (
                  <div
                    key={`${scheduledMove.scheduleId}-${scheduledMove.at.toISOString()}`}
                    className="@container pointer-events-none absolute inset-x-0 z-[3] flex items-center"
                    style={{ top: wallClockMinute(scheduledMove.at) * MINUTE_HEIGHT }}
                  >
                    <Link
                      href={`/board?board=${scheduledMove.boardId}&card=${scheduledMove.cardId}`}
                      title={`${clockText(scheduledMove.at)} · ${scheduledMove.cardTitle} moves to ${scheduledMove.listName}`}
                      className="pointer-events-auto ml-1 inline-flex h-5 max-w-[calc(100%-0.5rem)] -translate-y-1/2 items-center gap-1 rounded-full border border-border-strong bg-background pr-2 pl-1.5 text-[11px] leading-none font-medium text-foreground shadow-soft transition-colors duration-150 hover:border-primary/50 hover:text-primary focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none"
                    >
                      <MoveRight aria-hidden="true" className="size-3 shrink-0" />
                      <span className="sr-only">
                        {`${clockText(scheduledMove.at)}: ${scheduledMove.cardTitle} moves to ${scheduledMove.listName}`}
                      </span>
                      <span aria-hidden="true" className="max-w-[7rem] shrink-0 truncate">
                        {scheduledMove.listName}
                      </span>
                      <span
                        aria-hidden="true"
                        className="hidden min-w-0 truncate font-normal text-muted-foreground @min-[10rem]:inline"
                      >
                        {scheduledMove.cardTitle}
                      </span>
                    </Link>
                    <span
                      aria-hidden="true"
                      className="h-0 flex-1 -translate-y-1/2 border-t border-dashed border-foreground/35"
                    />
                  </div>
                ))}
              {gridDay.isToday ? (
                <div
                  aria-label={`Now, ${clockText(now)}`}
                  className="pointer-events-none absolute inset-x-0 z-[3] flex items-center"
                  style={{ top: nowMinute * MINUTE_HEIGHT }}
                >
                  <span className="-ml-1 size-2 rounded-full bg-danger" />
                  <span className="h-px flex-1 bg-danger" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </CalendarScrollArea>
  );
};

export default CalendarGrid;
