import { describe, expect, test } from 'vitest';
import joinClassNames from '@/core/class-names';

describe('joinClassNames', () => {
  test('lets a later theme color and shadow replace the defaults', () => {
    expect(joinClassNames('bg-background shadow-soft', 'bg-transparent shadow-none')).toBe(
      'bg-transparent shadow-none',
    );
  });

  test('keeps a text color and a text size together', () => {
    expect(joinClassNames('text-sm', 'text-muted-foreground')).toBe(
      'text-sm text-muted-foreground',
    );
  });

  test('drops falsy entries', () => {
    expect(joinClassNames('flex', false, null, undefined, 'gap-2')).toBe('flex gap-2');
  });
});
