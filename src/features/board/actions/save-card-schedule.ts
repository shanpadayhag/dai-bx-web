import AppError from '@/core/app-error';
import readFormText, { readFormCategoryId, readFormRepeatRule } from '@/core/form-text';
import type { RepeatRule } from '@/core/repeat-rule';
import { instantInZone } from '@/core/zoned-time';
import backendCardScheduleSource from '@/features/board/data_sources/backend/card-schedule-source';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type CardSchedule from '@/features/board/entities/card-schedule';
import {
  cardScheduleFromRecord,
  type CalendarBlock,
  type CardScheduleKind,
} from '@/features/board/entities/card-schedule';

type ScheduleFormInput = {
  kind: CardScheduleKind;
  targetListId: string;
  date: string;
  time: string;
  timeZone: string;
  repeatRule: RepeatRule | null;
  calendarBlock: CalendarBlock | null;
};

type SaveCardScheduleParams = {
  cardId: BoardCardRecord['id'];
  scheduleId: CardSchedule['id'] | null;
  scheduleInput: ScheduleFormInput;
  now: Date;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

const readScheduleForm = (
  submittedForm: FormData,
  blockCategoryField: string,
): ScheduleFormInput => {
  const kind = readFormText(submittedForm, 'kind') === 'repeating' ? 'repeating' : 'once';
  const blockMinutesText = readFormText(submittedForm, 'blockMinutes');
  return {
    kind,
    targetListId: readFormText(submittedForm, 'targetListId'),
    date: readFormText(submittedForm, 'date'),
    time: readFormText(submittedForm, 'time').slice(0, 5),
    timeZone: readFormText(submittedForm, 'timeZone'),
    repeatRule: kind === 'repeating' ? readFormRepeatRule(submittedForm, 'repeat') : null,
    calendarBlock:
      kind === 'repeating' && blockMinutesText !== ''
        ? {
            lengthMinutes: Number(blockMinutesText),
            categoryId: readFormCategoryId(submittedForm, blockCategoryField),
          }
        : null,
  };
};

const checkScheduleInput = (scheduleInput: ScheduleFormInput, now: Date) => {
  if (scheduleInput.targetListId === '') {
    throw new AppError('Pick a column', 'Choose the column this card moves to.');
  }
  const timeMatch = TIME_PATTERN.exec(scheduleInput.time);
  if (!DATE_PATTERN.test(scheduleInput.date) || timeMatch === null) {
    throw new AppError('Pick a date and time', 'A schedule needs a date and a time to run.');
  }
  if (scheduleInput.kind === 'repeating' && scheduleInput.repeatRule === null) {
    throw new AppError('Pick how it repeats', 'A repeating schedule needs a repeat.');
  }
  if (scheduleInput.kind === 'once') {
    const [hour = 0, minute = 0] = timeMatch.slice(1).map(Number);
    const startsAt = instantInZone(scheduleInput.date, hour * 60 + minute, scheduleInput.timeZone);
    if (startsAt.getTime() <= now.getTime()) {
      throw new AppError('Pick a later time', 'A one-time move has to be in the future.');
    }
  }
};

const saveCardSchedule = async (params: SaveCardScheduleParams): Promise<CardSchedule[]> => {
  const { scheduleInput } = params;
  checkScheduleInput(scheduleInput, params.now);
  const scheduleWrite = {
    kind: scheduleInput.kind,
    targetListId: scheduleInput.targetListId,
    start: `${scheduleInput.date}T${scheduleInput.time}`,
    inputZone: scheduleInput.timeZone,
    timeZone: scheduleInput.timeZone,
    ...(scheduleInput.repeatRule === null ? {} : { repeat: scheduleInput.repeatRule }),
    block:
      scheduleInput.calendarBlock === null
        ? null
        : {
            minutes: scheduleInput.calendarBlock.lengthMinutes,
            categoryId: scheduleInput.calendarBlock.categoryId,
          },
  };
  const savedSchedules =
    params.scheduleId === null
      ? await backendCardScheduleSource.create(params.cardId, scheduleWrite)
      : await backendCardScheduleSource.update(params.scheduleId, scheduleWrite);
  return savedSchedules.schedules.map(cardScheduleFromRecord);
};

export type { SaveCardScheduleParams, ScheduleFormInput };
export { readScheduleForm };
export default saveCardSchedule;
