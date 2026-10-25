import { afterEach, expect, test } from 'vitest';
import { applyAppearance, forgetAppearance, readAppliedAppearance } from '@/core/appearance';

afterEach(() => forgetAppearance());

test('a chosen theme and accent are set on the page and remembered', () => {
  applyAppearance({ accentColor: 'teal', theme: 'dark' });

  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.dataset.accent).toBe('teal');
  expect(JSON.parse(window.localStorage.getItem('daibx:appearance') ?? 'null')).toEqual({
    accentColor: 'teal',
    theme: 'dark',
  });
});

test('the defaults leave the page attributes off so the system and blue apply', () => {
  applyAppearance({ accentColor: 'teal', theme: 'dark' });

  applyAppearance({ accentColor: 'blue', theme: 'system' });

  expect(document.documentElement.dataset.theme).toBeUndefined();
  expect(document.documentElement.dataset.accent).toBeUndefined();
});

test('only the theme and accent are remembered, never the rest of the account', () => {
  const signedInAccount = {
    name: 'Shan Padayhag',
    email: 'shan@daibx.test',
    accentColor: 'indigo' as const,
    theme: 'light' as const,
  };

  applyAppearance(signedInAccount);

  expect(JSON.parse(window.localStorage.getItem('daibx:appearance') ?? 'null')).toEqual({
    accentColor: 'indigo',
    theme: 'light',
  });
});

test('the applied appearance reads back from the page, with defaults when unset', () => {
  expect(readAppliedAppearance()).toEqual({ accentColor: 'blue', theme: 'system' });

  applyAppearance({ accentColor: 'graphite', theme: 'dark' });

  expect(readAppliedAppearance()).toEqual({ accentColor: 'graphite', theme: 'dark' });
});

test('forgetting the appearance clears the page and the stored copy', () => {
  applyAppearance({ accentColor: 'violet', theme: 'light' });

  forgetAppearance();

  expect(document.documentElement.dataset.accent).toBeUndefined();
  expect(window.localStorage.getItem('daibx:appearance')).toBeNull();
});
