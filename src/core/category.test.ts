import { describe, expect, test } from 'vitest';
import { categoryColorStyle, readableTextColor } from '@/core/category';

describe('readableTextColor', () => {
  test('puts white text on a dark category color', () => {
    expect(readableTextColor('#3a405a')).toBe('#ffffff');
  });

  test('puts ink text on light and middle category colors', () => {
    expect(readableTextColor('#c6afa3')).toBe('#0c1324');
    expect(readableTextColor('#7c95bd')).toBe('#0c1324');
    expect(readableTextColor('#be7e86')).toBe('#0c1324');
  });
});

describe('categoryColorStyle', () => {
  test('exposes the color and its readable text color as CSS variables', () => {
    expect(categoryColorStyle({ id: 'personal', name: 'Personal', color: '#3a405a' })).toEqual({
      '--category': '#3a405a',
      '--category-foreground': '#ffffff',
    });
  });
});
