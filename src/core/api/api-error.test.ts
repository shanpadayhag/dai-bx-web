import { expect, test } from 'vitest';
import { ApiError, describeRetryWait } from '@/core/api/api-error';

test.each([
  [1, '1 second'],
  [45, '45 seconds'],
  [60, '1 minute'],
  [61, '2 minutes'],
  [900, '15 minutes'],
  [3600, '1 hour'],
  [5400, '2 hours'],
])('a wait of %i seconds reads as %s', (retryAfterSeconds, expectedWait) => {
  expect(describeRetryWait(retryAfterSeconds)).toBe(expectedWait);
});

test('a backend message becomes a sentence', () => {
  expect(new ApiError(422, 'enter a valid email address', null).description).toBe(
    'Enter a valid email address.',
  );
  expect(new ApiError(422, 'Already a sentence.', null).description).toBe('Already a sentence.');
});
