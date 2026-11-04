import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { IOS_INPUT_ZOOM_SCRIPT } from '@/core/ios-input-zoom';

const viewportContent = 'width=device-width, initial-scale=1';

const runOnDevice = (userAgent: string, maxTouchPoints: number): string | null => {
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints });
  new Function(IOS_INPUT_ZOOM_SCRIPT)();
  return document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? null;
};

describe('IOS_INPUT_ZOOM_SCRIPT', () => {
  beforeEach(() => {
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = viewportContent;
    document.head.append(viewportMeta);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.head.querySelector('meta[name="viewport"]')?.remove();
  });

  test('an iPhone gets maximum-scale=1 so focused inputs do not zoom', () => {
    expect(runOnDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5)).toBe(
      `${viewportContent}, maximum-scale=1`,
    );
  });

  test('an iPad that reports itself as a Mac gets maximum-scale=1', () => {
    expect(runOnDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(
      `${viewportContent}, maximum-scale=1`,
    );
  });

  test('Android keeps pinch-zoom', () => {
    expect(runOnDevice('Mozilla/5.0 (Linux; Android 15; Pixel 9)', 5)).toBe(viewportContent);
  });

  test('a desktop Mac keeps its viewport', () => {
    expect(runOnDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(viewportContent);
  });
});
