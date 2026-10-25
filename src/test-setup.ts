import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => cleanup());

window.matchMedia ??= vi.fn((mediaQuery: string) => ({
  matches: false,
  media: mediaQuery,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

if (typeof HTMLElement.prototype.showPopover !== 'function') {
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    this.style.display = 'block';
  };
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    this.style.display = '';
  };
  HTMLElement.prototype.togglePopover = function togglePopover(this: HTMLElement) {
    const isOpen = this.style.display === 'block';
    if (isOpen) this.hidePopover();
    else this.showPopover();
    return !isOpen;
  };
  document.addEventListener('click', (clickEvent) => {
    const popoverTrigger =
      clickEvent.target instanceof Element ? clickEvent.target.closest('[popovertarget]') : null;
    const popoverTargetId = popoverTrigger?.getAttribute('popovertarget');
    if (!popoverTargetId) return;
    const targetPopover = document.getElementById(popoverTargetId);
    const triggerAction = popoverTrigger?.getAttribute('popovertargetaction') ?? 'toggle';
    if (targetPopover === null) return;
    if (triggerAction === 'show') targetPopover.showPopover();
    else if (triggerAction === 'hide') targetPopover.hidePopover();
    else targetPopover.togglePopover();
  });
}
