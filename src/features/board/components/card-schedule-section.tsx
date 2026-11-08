'use client';

import {
  CalendarClock,
  CalendarRange,
  ChevronRight,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  Trash2,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { Category } from '@/core/category';
import joinClassNames from '@/core/class-names';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import MenuItem from '@/core/components/molecules/menu-item';
import PopoverMenu, { MenuSeparator } from '@/core/components/molecules/popover-menu';
import localCalendarDate from '@/core/local-date';
import hidePopover from '@/core/popover';
import { describeRepeatRule } from '@/core/repeat-rule';
import { timeZonePlaceName } from '@/core/time-zone';
import ScheduleFormDialog from '@/features/board/components/schedule-form-dialog';
import type BoardList from '@/features/board/entities/board-list';
import type CardSchedule from '@/features/board/entities/card-schedule';
import {
  formatClock,
  formatMinutesLength,
  formatScheduleDay,
  formatScheduleMoment,
  formatTrackedMinutes,
  type ScheduleRun,
} from '@/features/board/entities/card-schedule';

const SCHEDULE_LIMIT = 20;
const SCHEDULE_FORM_DIALOG_ID = 'card-schedule-form-dialog';

const RUN_TIMING_BADGES = {
  onTime: null,
  late: { label: 'Late', tone: 'warning' },
  byHand: { label: 'By hand', tone: 'primary' },
} as const;

type CardScheduleSectionProps = {
  cardTitle: string;
  schedules: readonly CardSchedule[];
  lists: readonly BoardList[];
  categories: readonly Category[];
  calendarTimeZone: string;
  now: Date;
};

const describeSchedule = (schedule: CardSchedule, calendarTimeZone: string): string => {
  const ruleText =
    schedule.repeatRule === null
      ? `Once on ${formatScheduleDay(schedule.firstAt)}`
      : describeRepeatRule(schedule.repeatRule, localCalendarDate(schedule.firstAt));
  const zoneText =
    schedule.timeZone === calendarTimeZone ? '' : ` ${timeZonePlaceName(schedule.timeZone)} time`;
  return `${ruleText} · ${formatClock(schedule.firstAt)}${zoneText}`;
};

const ScheduleRunList = ({ runs }: { runs: readonly ScheduleRun[] }) => (
  <details className="group/runs">
    <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
      <ChevronRight
        aria-hidden="true"
        className="size-3.5 transition-transform duration-150 group-open/runs:rotate-90"
      />
      {runs.length === 1 ? '1 run' : `${runs.length} runs`}
    </summary>
    <ul className="mt-2 grid gap-px overflow-hidden rounded-lg border border-border">
      {runs.map((scheduleRun) => {
        const timingBadge = RUN_TIMING_BADGES[scheduleRun.timing];
        return (
          <li
            key={scheduleRun.id}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-surface px-3 py-2 text-xs"
          >
            <time
              dateTime={scheduleRun.ranAt.toISOString()}
              className="text-foreground tabular-nums"
            >
              {formatScheduleDay(scheduleRun.ranAt)}, {formatClock(scheduleRun.ranAt)}
            </time>
            {timingBadge === null ? null : (
              <Badge tone={timingBadge.tone}>{timingBadge.label}</Badge>
            )}
            <span className="ml-auto text-muted-foreground tabular-nums">
              {formatTrackedMinutes(scheduleRun.trackedMinutes)}
            </span>
          </li>
        );
      })}
    </ul>
  </details>
);

type ScheduleRowProps = {
  schedule: CardSchedule;
  categories: readonly Category[];
  calendarTimeZone: string;
  now: Date;
  onEdit: () => void;
};

const ScheduleRow = ({ schedule, categories, calendarTimeZone, now, onEdit }: ScheduleRowProps) => {
  const menuId = `schedule-menu-${schedule.id}`;
  const isFlagged = schedule.targetListId === null;
  const isDone = schedule.kind === 'once' && schedule.nextRunAt === null;
  const blockCategory = categories.find(
    (category) => category.id === schedule.calendarBlock?.categoryId,
  );
  const closeThen = (chooseAction: () => void) => () => {
    hidePopover(menuId);
    chooseAction();
  };
  const ScheduleIcon = schedule.kind === 'repeating' ? Repeat : CalendarClock;

  return (
    <li
      className={joinClassNames(
        'grid gap-2.5 rounded-xl border p-3',
        isFlagged ? 'border-warning/40' : 'border-border',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={joinClassNames(
            'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
            schedule.isPaused || isDone
              ? 'bg-surface-strong text-muted-foreground'
              : 'bg-primary-soft text-primary-soft-foreground',
          )}
        >
          <ScheduleIcon />
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground">
            <span className="min-w-0">
              Move to{' '}
              {isFlagged ? (
                <span className="text-muted-foreground">a deleted column</span>
              ) : (
                <span className="font-medium">{schedule.targetListName}</span>
              )}
            </span>
            {isDone ? <Badge tone="success">Done</Badge> : null}
            {schedule.isPaused ? <Badge>Paused</Badge> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {describeSchedule(schedule, calendarTimeZone)}
          </p>
          {schedule.nextRunAt === null || schedule.isPaused ? null : (
            <p className="text-xs text-muted-foreground">
              Next{' '}
              <time
                dateTime={schedule.nextRunAt.toISOString()}
                className="font-medium text-foreground tabular-nums"
              >
                {formatScheduleMoment(schedule.nextRunAt, now)}
              </time>
            </p>
          )}
          {schedule.calendarBlock === null ? null : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarRange aria-hidden="true" className="size-3.5" />
              Blocks {formatMinutesLength(schedule.calendarBlock.lengthMinutes)}
              {blockCategory === undefined ? null : ` of ${blockCategory.name}`} on the calendar
            </p>
          )}
        </div>
        <IconButton
          label="Actions for this schedule"
          popoverTarget={menuId}
          className="-mt-0.5 -mr-1 size-8"
        >
          <MoreHorizontal />
        </IconButton>
        <PopoverMenu id={menuId} label="Schedule actions">
          <MenuItem
            icon={<Zap />}
            label="Run now"
            isDisabled={isFlagged}
            onChoose={closeThen(() => undefined)}
          />
          {isDone ? null : schedule.isPaused ? (
            <MenuItem
              icon={<Play />}
              label="Resume"
              isDisabled={isFlagged}
              onChoose={closeThen(() => undefined)}
            />
          ) : (
            <MenuItem icon={<Pause />} label="Pause" onChoose={closeThen(() => undefined)} />
          )}
          <MenuItem
            icon={<Pencil />}
            label="Edit"
            popoverTarget={SCHEDULE_FORM_DIALOG_ID}
            onChoose={closeThen(onEdit)}
          />
          <MenuSeparator />
          <MenuItem
            icon={<Trash2 />}
            label="Delete schedule"
            tone="danger"
            onChoose={closeThen(() => undefined)}
          />
        </PopoverMenu>
      </div>
      {isFlagged ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-warning-soft px-3 py-2">
          <p className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-warning">
            <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            Its column was deleted. Pick another.
          </p>
          <Button
            variant="secondary"
            size="sm"
            popoverTarget={SCHEDULE_FORM_DIALOG_ID}
            onClick={onEdit}
          >
            Pick a column
          </Button>
        </div>
      ) : null}
      {schedule.runs.length === 0 ? null : <ScheduleRunList runs={schedule.runs} />}
    </li>
  );
};

const CardScheduleSection = ({
  cardTitle,
  schedules,
  lists,
  categories,
  calendarTimeZone,
  now,
}: CardScheduleSectionProps) => {
  const [editedScheduleId, setEditedScheduleId] = useState<string | null>(null);
  const [formResetCount, setFormResetCount] = useState(0);
  const editedSchedule = schedules.find((schedule) => schedule.id === editedScheduleId) ?? null;
  const isAtLimit = schedules.length >= SCHEDULE_LIMIT;

  const openForm = (scheduleId: string | null) => {
    setEditedScheduleId(scheduleId);
    setFormResetCount((resetCount) => resetCount + 1);
  };

  return (
    <section className="grid gap-3" aria-labelledby="card-schedule-heading">
      <div className="flex items-center justify-between">
        <h3 id="card-schedule-heading" className="text-[13px] font-semibold text-foreground">
          Schedule
        </h3>
        <Button
          variant="ghost"
          size="sm"
          disabled={isAtLimit}
          title={isAtLimit ? `A card can have up to ${SCHEDULE_LIMIT} schedules` : undefined}
          popoverTarget={SCHEDULE_FORM_DIALOG_ID}
          onClick={() => openForm(null)}
        >
          <Plus />
          Add schedule
        </Button>
      </div>
      {schedules.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Nothing scheduled. Add one to move this card into a column by itself, once or on repeat.
        </p>
      ) : (
        <ul className="grid gap-2">
          {schedules.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              categories={categories}
              calendarTimeZone={calendarTimeZone}
              now={now}
              onEdit={() => openForm(schedule.id)}
            />
          ))}
        </ul>
      )}
      <ScheduleFormDialog
        id={SCHEDULE_FORM_DIALOG_ID}
        cardTitle={cardTitle}
        editedSchedule={editedSchedule}
        formResetCount={formResetCount}
        lists={lists}
        categories={categories}
        calendarTimeZone={calendarTimeZone}
        now={now}
      />
    </section>
  );
};

export default CardScheduleSection;
