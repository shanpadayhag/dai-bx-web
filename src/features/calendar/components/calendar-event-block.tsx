import { Repeat } from 'lucide-react';
import type { CSSProperties, PointerEvent } from 'react';
import { categoryColorStyle } from '@/core/category';
import joinClassNames from '@/core/class-names';
import { isEventRunning, trimmedEventMinutes } from '@/features/calendar/entities/calendar-event';
import type { EventPiece } from '@/features/calendar/entities/day-layout';
import { formatEventTimeRange } from '@/features/calendar/entities/event-time';

type CalendarEventBlockProps = {
  piece: EventPiece;
  cascadeLevel: 0 | 1;
  minuteHeight: number;
  isSelected: boolean;
  isDragged: boolean;
  timeZone: string;
  onSelect: (eventId: string) => void;
  onStartDrag: (
    dragKind: 'move' | 'resize',
    piece: EventPiece,
    pointerEvent: PointerEvent<HTMLElement>,
  ) => void;
};

const CalendarEventBlock = ({
  piece,
  cascadeLevel,
  minuteHeight,
  isSelected,
  isDragged,
  timeZone,
  onSelect,
  onStartDrag,
}: CalendarEventBlockProps) => {
  const { event: calendarEvent } = piece;
  const durationMinutes = piece.endMinute - piece.startMinute;
  const isRunning = isEventRunning(calendarEvent);
  const trimmedMinutes = piece.continuesAfter ? 0 : trimmedEventMinutes(calendarEvent);
  const isShort = durationMinutes < 40;
  const isRoomy = durationMinutes >= 75;
  const timeRangeLabel = formatEventTimeRange(calendarEvent, timeZone);
  const isPlanned = calendarEvent.kind === 'planned';
  const canResize = isPlanned && !piece.continuesAfter;
  const blockStyle: CSSProperties = {
    ...(calendarEvent.category === null ? {} : categoryColorStyle(calendarEvent.category)),
    top: piece.startMinute * minuteHeight,
    height: Math.max(durationMinutes * minuteHeight, 20),
    left: cascadeLevel === 1 ? 'var(--cascade-step)' : '4px',
    zIndex: cascadeLevel === 1 ? 2 : 1,
  };

  return (
    <div
      className={joinClassNames('group absolute right-1', isDragged && 'opacity-40')}
      style={blockStyle}
    >
      <button
        type="button"
        title={`${calendarEvent.title} · ${timeRangeLabel}`}
        aria-label={[
          `${calendarEvent.title} ${timeRangeLabel}`,
          ...(calendarEvent.series === undefined ? [] : ['repeats']),
          ...(trimmedMinutes > 0 ? [`${trimmedMinutes} minutes trimmed off`] : []),
        ].join(', ')}
        aria-current={isSelected ? 'true' : undefined}
        onClick={() => onSelect(calendarEvent.id)}
        onPointerDown={
          isPlanned ? (pointerEvent) => onStartDrag('move', piece, pointerEvent) : undefined
        }
        className={joinClassNames(
          'relative size-full rounded-lg text-left transition-[box-shadow,filter] duration-150 hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          calendarEvent.category === null
            ? calendarEvent.kind === 'planned'
              ? 'border border-dashed border-border-strong bg-surface text-foreground'
              : 'bg-surface-strong text-foreground'
            : calendarEvent.kind === 'planned'
              ? 'category-soft'
              : 'category-solid',
          calendarEvent.kind === 'tracked' && 'shadow-soft',
          cascadeLevel === 1 && !isRunning && 'ring-2 ring-background',
          isRunning && 'shadow-lift ring-2 ring-foreground/70 ring-offset-2 ring-offset-background',
          isSelected && 'outline-2 outline-offset-2 outline-primary',
          isPlanned && 'cursor-grab active:cursor-grabbing',
        )}
      >
        <span
          className={joinClassNames(
            'flex h-full flex-col overflow-hidden px-2',
            isShort ? 'justify-center' : 'gap-0.5 py-1.5',
          )}
        >
          <span className="flex min-w-0 items-start gap-1">
            {calendarEvent.series === undefined ? null : (
              <Repeat aria-hidden="true" className="mt-px size-3 shrink-0 opacity-70" />
            )}
            <span
              className={joinClassNames(
                'min-w-0 text-xs leading-tight font-medium',
                isRoomy ? 'line-clamp-2' : 'truncate',
              )}
            >
              {calendarEvent.title}
            </span>
          </span>
          {isShort ? null : (
            <span className="truncate font-mono text-[11px] leading-tight tabular-nums opacity-80">
              {timeRangeLabel}
            </span>
          )}
        </span>
        {trimmedMinutes > 0 ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-full rounded-b-lg border border-t-0 border-dashed border-current/40 bg-[repeating-linear-gradient(135deg,currentColor_0_1.5px,transparent_1.5px_7px)] opacity-35"
            style={{
              height: trimmedMinutes * minuteHeight,
              color:
                calendarEvent.category === null ? 'var(--muted-foreground)' : 'var(--category)',
            }}
          />
        ) : null}
      </button>
      {canResize ? (
        <span
          aria-hidden="true"
          onPointerDown={(pointerEvent) => onStartDrag('resize', piece, pointerEvent)}
          className="absolute inset-x-2 -bottom-1 z-[1] flex h-2.5 cursor-ns-resize items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-coarse:hidden"
        >
          <span className="h-1 w-6 rounded-full bg-foreground/45" />
        </span>
      ) : null}
    </div>
  );
};

export default CalendarEventBlock;
