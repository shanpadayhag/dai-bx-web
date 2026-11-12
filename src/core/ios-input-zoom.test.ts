import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { IOS_INPUT_ZOOM_SCRIPT } from '@/core/ios-input-zoom';

const viewportContent = 'width=device-width, initial-scale=1';
const lockedContent = `${viewportContent}, maximum-scale=1`;
const IPHONE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)';

const addViewport = () => {
  const viewportMeta = document.createElement('meta');
  viewportMeta.name = 'viewport';
  viewportMeta.content = viewportContent;
  document.head.append(viewportMeta);
  return viewportMeta;
};

const viewportContents = () =>
  [...document.head.querySelectorAll('meta[name="viewport"]')].map((viewportMeta) =>
    viewportMeta.getAttribute('content'),
  );

const settleObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

const runOnDevice = (userAgent: string, maxTouchPoints: number) => {
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints });
  new Function(IOS_INPUT_ZOOM_SCRIPT)();
};

const startedObservers: MutationObserver[] = [];

class TrackedMutationObserver extends MutationObserver {
  constructor(observerCallback: MutationCallback) {
    super(observerCallback);
    startedObservers.push(this);
  }
}

describe('IOS_INPUT_ZOOM_SCRIPT', () => {
  beforeEach(() => {
    vi.stubGlobal('MutationObserver', TrackedMutationObserver);
    addViewport();
  });

  afterEach(() => {
    startedObservers.splice(0).forEach((startedObserver) => {
      startedObserver.disconnect();
    });
    vi.unstubAllGlobals();
    document.head.querySelectorAll('meta[name="viewport"]').forEach((viewportMeta) => {
      viewportMeta.remove();
    });
  });

  test('an iPhone gets maximum-scale=1 so focused inputs do not zoom', () => {
    runOnDevice(IPHONE_USER_AGENT, 5);

    expect(viewportContents()).toEqual([lockedContent]);
  });

  test('an iPad that reports itself as a Mac gets maximum-scale=1', () => {
    runOnDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5);

    expect(viewportContents()).toEqual([lockedContent]);
  });

  test('a second viewport tag added after the script runs is locked too', async () => {
    runOnDevice(IPHONE_USER_AGENT, 5);

    addViewport();
    await settleObserver();

    expect(viewportContents()).toEqual([lockedContent, lockedContent]);
  });

  test('a viewport tag swapped in on navigation is locked, never twice', async () => {
    runOnDevice(IPHONE_USER_AGENT, 5);

    document.head.querySelector('meta[name="viewport"]')?.remove();
    const swappedViewport = addViewport();
    await settleObserver();
    swappedViewport.setAttribute('content', viewportContent);
    await settleObserver();

    expect(viewportContents()).toEqual([lockedContent]);
  });

  test('Android keeps pinch-zoom, even when a viewport tag is added later', async () => {
    runOnDevice('Mozilla/5.0 (Linux; Android 15; Pixel 9)', 5);

    addViewport();
    await settleObserver();

    expect(viewportContents()).toEqual([viewportContent, viewportContent]);
  });

  test('a desktop Mac keeps its viewport', () => {
    runOnDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0);

    expect(viewportContents()).toEqual([viewportContent]);
  });
});
