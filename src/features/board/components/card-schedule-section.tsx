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
import { useState, type FormEvent } from 'react';
import type { Category } from '@/core/category';
import joinClassNames from '@/core/class-names';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import MenuItem from '@/core/components/molecules/menu-item';
import PopoverMenu, { MenuSeparator } from '@/core/components/molecules/popover-menu';
import hidePopover from '@/core/popover';
import { describeRepeatRule } from '@/core/repeat-rule';
import { timeZonePlaceName } from '@/core/time-zone';
import ScheduleFormDialog from '@/features/board/components/schedule-form-dialog';
import type BoardList from '@/features/board/entities/board-list';
import type CardSchedule from '@/features/board/entities/card-schedule';
import {
  formatClock,
  formatLocalStartDay,
  formatMinutesLength,
  formatScheduleDay,
  formatScheduleMoment,
  formatTrackedMinutes,
  localStartClock,
} from '@/features/board/entities/card-schedule';
import type ScheduleRunsPage from '@/features/board/entities/schedule-runs-page';

const SCHEDULE_LIMIT = 20;

const RUN_TIMING_BADGES = {
  onTime: null,
  late: { label: 'Late', tone: 'warning' },
  byHand: { label: 'By hand', tone: 'primary' },
} as const;

type ScheduleHandlers = {
  onSetPaused: (scheduleId: string, isPaused: boolean) => void;
  onRunNow: (scheduleId: string) => void;
  onDelete: (scheduleId: string) => void;
  onLoadRuns: (scheduleId: string, olderThan: Date | null) => void;
};

type CardScheduleSectionProps = ScheduleHandlers & {
  formDialogId: string;
  cardTitle: string;
  schedules: readonly CardSchedule[] | null;
  runsPages: Readonly<Record<string, ScheduleRunsPage>>;
  lists: readonly BoardList[];
  categories: readonly Category[];
  calendarTimeZone: string;
  now: Date;
  isSubmitting: boolean;
  onSubmitSchedule: (scheduleId: string | null, submitEvent: FormEvent<HTMLFormElement>) => void;
};

const describeSchedule = (schedule: CardSchedule, calendarTimeZone: string): string => {
  const ruleText =
    schedule.repeatRule === null
      ? `Once on ${formatLocalStartDay(schedule.localStart)}`
      : describeRepeatRule(schedule.repeatRule, schedule.localStart.slice(0, 10));
  const zoneText =
    schedule.timeZone === calendarTimeZone ? '' : ` ${timeZonePlaceName(schedule.timeZone)} time`;
  return `${ruleText} · ${localStartClock(schedule.localStart)}${zoneText}`;
};

type ScheduleRunListProps = {
  scheduleId: string;
  runsPage: ScheduleRunsPage | undefined;
  calendarTimeZone: string;
  onLoadRuns: ScheduleHandlers['onLoadRuns'];
};

const ScheduleRunList = ({
  scheduleId,
  runsPage,
  calendarTimeZone,
  onLoadRuns,
}: ScheduleRunListProps) => {
  const runs = runsPage?.runs ?? [];
  const lastRun = runs.at(-1);
  return (
    <details
      className="group/runs"
      onToggle={(toggleEvent) => {
        if (toggleEvent.currentTarget.open && runsPage === undefined) onLoadRuns(scheduleId, null);
      }}
    >
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 transition-transform duration-150 group-open/runs:rotate-90"
        />
        Runs
      </summary>
      {runs.length === 0 ? (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {runsPage === undefined || runsPage.isLoading ? 'Loading runs…' : 'No runs yet.'}
        </p>
      ) : (
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
                  {formatScheduleDay(scheduleRun.ranAt, calendarTimeZone)},{' '}
                  {formatClock(scheduleRun.ranAt, calendarTimeZone)}
                </time>
                {timingBadge === null ? null : (
                  <Badge tone={timingBadge.tone}>{timingBadge.label}</Badge>
                )}
                {scheduleRun.isMoved ? null : (
                  <span className="text-muted-foreground">already there</span>
                )}
                <span className="ml-auto text-muted-foreground tabular-nums">
                  {formatTrackedMinutes(scheduleRun.trackedMinutes)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {runsPage?.hasOlderRuns === true && lastRun !== undefined ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1"
          disabled={runsPage.isLoading}
          onClick={() => onLoadRuns(scheduleId, lastRun.ranAt)}
        >
          Show older runs
        </Button>
      ) : null}
    </details>
  );
};

type ScheduleRowProps = ScheduleHandlers & {
  formDialogId: string;
  schedule: CardSchedule;
  runsPage: ScheduleRunsPage | undefined;
  categories: readonly Category[];
  calendarTimeZone: string;
  now: Date;
  onEdit: () => void;
};

const ScheduleRow = ({
  formDialogId,
  schedule,
  runsPage,
  categories,
  calendarTimeZone,
  now,
  onEdit,
  onSetPaused,
  onRunNow,
  onDelete,
  onLoadRuns,
}: ScheduleRowProps) => {
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
                {formatScheduleMoment(schedule.nextRunAt, now, calendarTimeZone)}
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
            onChoose={closeThen(() => onRunNow(schedule.id))}
          />
          {isDone ? null : schedule.isPaused ? (
            <MenuItem
              icon={<Play />}
              label="Resume"
              isDisabled={isFlagged}
              onChoose={closeThen(() => onSetPaused(schedule.id, false))}
            />
          ) : (
            <MenuItem
              icon={<Pause />}
              label="Pause"
              onChoose={closeThen(() => onSetPaused(schedule.id, true))}
            />
          )}
          <MenuItem
            icon={<Pencil />}
            label="Edit"
            popoverTarget={formDialogId}
            onChoose={closeThen(onEdit)}
          />
          <MenuSeparator />
          <MenuItem
            icon={<Trash2 />}
            label="Delete schedule"
            tone="danger"
            onChoose={closeThen(() => onDelete(schedule.id))}
          />
        </PopoverMenu>
      </div>
      {isFlagged ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-warning-soft px-3 py-2">
          <p className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-warning">
            <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            Its column was deleted. Pick another.
          </p>
          <Button variant="secondary" size="sm" popoverTarget={formDialogId} onClick={onEdit}>
            Pick a column
          </Button>
        </div>
      ) : null}
      <ScheduleRunList
        scheduleId={schedule.id}
        runsPage={runsPage}
        calendarTimeZone={calendarTimeZone}
        onLoadRuns={onLoadRuns}
      />
    </li>
  );
};

const CardScheduleSection = ({
  formDialogId,
  cardTitle,
  schedules,
  runsPages,
  lists,
  categories,
  calendarTimeZone,
  now,
  isSubmitting,
  onSubmitSchedule,
  ...scheduleHandlers
}: CardScheduleSectionProps) => {
  const [editedScheduleId, setEditedScheduleId] = useState<string | null>(null);
  const [formResetCount, setFormResetCount] = useState(0);
  const editedSchedule = schedules?.find((schedule) => schedule.id === editedScheduleId) ?? null;
  const isAtLimit = schedules !== null && schedules.length >= SCHEDULE_LIMIT;

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
          disabled={schedules === null || isAtLimit}
          title={isAtLimit ? `A card can have up to ${SCHEDULE_LIMIT} schedules` : undefined}
          popoverTarget={formDialogId}
          onClick={() => openForm(null)}
        >
          <Plus />
          Add schedule
        </Button>
      </div>
      {schedules === null ? (
        <p role="status" className="text-[13px] text-muted-foreground">
          Loading schedules…
        </p>
      ) : schedules.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Nothing scheduled. Add one to move this card into a column by itself, once or on repeat.
        </p>
      ) : (
        <ul className="grid gap-2">
          {schedules.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              formDialogId={formDialogId}
              schedule={schedule}
              runsPage={runsPages[schedule.id]}
              categories={categories}
              calendarTimeZone={calendarTimeZone}
              now={now}
              onEdit={() => openForm(schedule.id)}
              {...scheduleHandlers}
            />
          ))}
        </ul>
      )}
      <ScheduleFormDialog
        id={formDialogId}
        cardTitle={cardTitle}
        editedSchedule={editedSchedule}
        formResetCount={formResetCount}
        lists={lists}
        categories={categories}
        calendarTimeZone={calendarTimeZone}
        now={now}
        isSubmitting={isSubmitting}
        onSubmit={onSubmitSchedule}
      />
    </section>
  );
};

export default CardScheduleSection;
