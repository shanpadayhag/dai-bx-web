import { beforeEach, expect, test } from 'vitest';
import localStoragePlanChoiceSource from '@/features/planning/data_sources/local_storage/plan-choice-source';

beforeEach(() => window.localStorage.clear());

test('remembers the days and groups, and starts with today and every group', () => {
  expect(localStoragePlanChoiceSource.find()).toEqual({ dayCount: 1, groupIds: null });

  localStoragePlanChoiceSource.save({ dayCount: 7, groupIds: ['group-work'] });

  expect(localStoragePlanChoiceSource.find()).toEqual({ dayCount: 7, groupIds: ['group-work'] });
});

test('a damaged saved choice falls back to the start', () => {
  window.localStorage.setItem('daibx:plan-choice', '{"dayCount":3,"groupIds":[1]}');
  expect(localStoragePlanChoiceSource.find()).toEqual({ dayCount: 1, groupIds: null });
  window.localStorage.setItem('daibx:plan-choice', 'not json');
  expect(localStoragePlanChoiceSource.find()).toEqual({ dayCount: 1, groupIds: null });
});
