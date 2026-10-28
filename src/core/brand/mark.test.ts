import { describe, expect, test } from 'vitest';
import {
  BRAND_COLOR,
  MARK_VIEWBOX_SIZE,
  markBars,
  markShapesSvg,
  markSvg,
} from '@/core/brand/mark';

const countOccurrences = (text: string, fragment: string) => text.split(fragment).length - 1;

describe('markShapesSvg', () => {
  test('draws the tile in the given color with the given corner radius', () => {
    const shapesSvg = markShapesSvg({ tileColor: '#123456', tileCornerRadius: 8 });

    expect(shapesSvg).toContain(
      `<rect width="${MARK_VIEWBOX_SIZE}" height="${MARK_VIEWBOX_SIZE}" rx="8" fill="#123456"/>`,
    );
  });

  test('draws every bar in white at its own opacity', () => {
    const shapesSvg = markShapesSvg({ tileColor: BRAND_COLOR, tileCornerRadius: 8 });

    expect(countOccurrences(shapesSvg, 'fill="#ffffff"')).toBe(markBars.length);
    markBars.forEach((markBar) => {
      expect(shapesSvg).toContain(
        `x="${markBar.x}" y="${markBar.y}" width="${markBar.width}" height="3" rx="1.5" fill="#ffffff" fill-opacity="${markBar.opacity}"`,
      );
    });
  });

  test('draws a full-bleed square when the corner radius is zero', () => {
    expect(markShapesSvg({ tileColor: BRAND_COLOR, tileCornerRadius: 0 })).toContain('rx="0"');
  });
});

describe('markSvg', () => {
  test('wraps the shapes in a standalone svg on the mark viewBox', () => {
    const standaloneSvg = markSvg({ tileColor: BRAND_COLOR, tileCornerRadius: 8 });

    expect(standaloneSvg).toMatch(
      new RegExp(
        `^<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_VIEWBOX_SIZE} ${MARK_VIEWBOX_SIZE}">`,
      ),
    );
    expect(standaloneSvg).toContain(markShapesSvg({ tileColor: BRAND_COLOR, tileCornerRadius: 8 }));
    expect(standaloneSvg.endsWith('</svg>\n')).toBe(true);
  });
});
