import { afterEach, expect, test } from 'vitest';
import clearBrowserData from '@/core/browser-data';

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test('clearing browser data removes every DaiBX key but the appearance choice', () => {
  window.localStorage.setItem('daibx:appearance', '{"accentColor":"teal","theme":"dark"}');
  window.localStorage.setItem('daibx:last-board-id', 'board-1');
  window.localStorage.setItem('daibx:task-view', 'list');
  window.sessionStorage.setItem('daibx:pending-email', 'shan@daibx.test');
  window.sessionStorage.setItem('daibx:calendar-view', 'week');

  clearBrowserData();

  expect(Object.keys(window.localStorage)).toEqual(['daibx:appearance']);
  expect(Object.keys(window.sessionStorage)).toEqual([]);
});

test('clearing browser data leaves keys other sites on this origin wrote', () => {
  window.localStorage.setItem('other-tool', 'kept');
  window.sessionStorage.setItem('other-tool', 'kept');

  clearBrowserData();

  expect(window.localStorage.getItem('other-tool')).toBe('kept');
  expect(window.sessionStorage.getItem('other-tool')).toBe('kept');
});
